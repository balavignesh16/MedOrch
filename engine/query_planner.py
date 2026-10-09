"""Model-independent query planning contract.

QueryPlanner is a Protocol so tests can inject a fake planner without ever
calling a live LLM. The NVIDIA/OpenAI-compatible adapter is the only piece
that talks to a real model, and it is isolated behind this contract.

Structured model output is a parsing convenience, not a security boundary:
every plan's SQL still passes through engine.sql_guard before execution.
"""

from __future__ import annotations

import json
from typing import Literal, Protocol

import openai
from pydantic import BaseModel, ValidationError, field_validator

ReasonCode = Literal[
    "supported",
    "missing_data",
    "unsafe_request",
    "unrelated_request",
    "invalid_request",
]


class QueryPlan(BaseModel):
    supported: bool
    reason_code: ReasonCode
    sql: str | None = None
    # Only ever displayed to the user when supported=False (see
    # AnalyticsEngineServicer.ProcessQuery). Small local models frequently
    # omit this field when they judge a request supported, since from their
    # perspective there is "nothing to say" — defaulting it to "" instead of
    # requiring it avoids a schema-validation failure (and the retry loop it
    # triggers) for an omission that has no effect on supported plans.
    user_message: str = ""

    @field_validator("user_message", mode="before")
    @classmethod
    def _coerce_null_user_message(cls, value: object) -> object:
        # Some models write the field explicitly as JSON null instead of
        # omitting it (arguably more spec-compliant output than omission),
        # which a plain `str = ""` default does not catch — Pydantic still
        # rejects an explicit None against a str-typed field. Observed with
        # qwen2.5:14b-instruct, which hit this on 3 of 4 real prompts.
        return "" if value is None else value

    def model_post_init(self, __context: object) -> None:
        if self.supported and not self.sql:
            raise ValueError("A supported plan must include SQL")
        if not self.supported and self.sql:
            raise ValueError("An unsupported plan must not include SQL")
        if not self.supported and not self.user_message:
            raise ValueError("An unsupported plan must include a user_message")


class PlannerError(RuntimeError):
    """Raised when a planner fails to produce a valid, safe plan."""


class PlannerTimeoutError(PlannerError):
    """Raised when the underlying model call exceeds its configured timeout."""


class PlannerConnectionError(PlannerError):
    """Raised when the configured LLM endpoint cannot be reached at all
    (e.g. Ollama isn't running). Distinct from a malformed/invalid response
    from a reachable model — the two need different user-facing messages
    and neither is worth retrying (a dead connection won't self-heal
    within the retry loop's timescale)."""


class PlannerServiceError(PlannerError):
    """Raised when the LLM endpoint was reachable but returned a server-side
    (5xx) error — observed in practice as Ollama refusing to load a model
    because the host doesn't have enough free memory right now. Not the
    model's fault and not a malformed-output problem, so it gets its own
    message; not retried, since a memory shortage won't resolve itself
    within the retry loop's timescale."""


class QueryPlanner(Protocol):
    def plan(self, prompt: str, context_id: str, schema_prompt: str) -> QueryPlan: ...


PLAN_JSON_INSTRUCTIONS = """Respond with strict JSON only, matching exactly this schema:
{"supported": boolean, "reason_code": "supported"|"missing_data"|"unsafe_request"|"unrelated_request"|"invalid_request", "sql": string or null, "user_message": string}
Do not include markdown fences, prose, or any explanation of your reasoning outside the JSON object.
If supported is false, sql must be null. If supported is true, sql must be a single SQLite SELECT statement.
"""


def parse_plan_json(raw_text: str) -> QueryPlan:
    """Parse strict JSON planner output. Never falls back to extracting SQL
    from arbitrary prose — malformed output is a hard failure."""
    try:
        payload = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise PlannerError("Planner did not return valid JSON") from exc
    try:
        return QueryPlan.model_validate(payload)
    except ValidationError as exc:
        raise PlannerError(f"Planner output failed schema validation: {exc}") from exc


class NvidiaQueryPlanner:
    """Adapter over the configured NVIDIA/OpenAI-compatible chat model.

    Does not assume native structured-output tool-calling is available on
    the configured endpoint: it requests strict JSON and parses it with
    Pydantic, rejecting anything that doesn't validate. No rationale or
    chain-of-thought field is ever requested or stored.
    """

    def __init__(self, llm: object, *, model_version: str, max_retries: int = 1) -> None:
        self._llm = llm
        self.model_version = model_version
        self._max_retries = max_retries

    def plan(self, prompt: str, context_id: str, schema_prompt: str) -> QueryPlan:
        planning_prompt = (
            f"{schema_prompt}\n{PLAN_JSON_INSTRUCTIONS}\n"
            f"Context: {context_id}\nUser request: {prompt}\nJSON:"
        )
        last_error: Exception | None = None
        for _ in range(self._max_retries + 1):
            try:
                response = self._llm.invoke(planning_prompt)  # type: ignore[attr-defined]
            except (openai.APITimeoutError, TimeoutError) as exc:
                raise PlannerTimeoutError("Planner request timed out") from exc
            except openai.APIConnectionError as exc:
                raise PlannerConnectionError(
                    "Could not reach the configured LLM endpoint"
                ) from exc
            except openai.APIStatusError as exc:
                if exc.status_code >= 500:
                    raise PlannerServiceError(
                        f"LLM endpoint returned a server error (status {exc.status_code})"
                    ) from exc
                last_error = exc
                continue
            except openai.OpenAIError as exc:
                last_error = exc
                continue

            try:
                raw_text = str(response.content).strip()
                raw_text = raw_text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                return parse_plan_json(raw_text)
            except PlannerError as exc:
                last_error = exc
                continue
        raise PlannerError(f"Planner failed after retries: {last_error}")

from __future__ import annotations

from concurrent import futures
import json
import logging
import sys
import uuid
from typing import Any, Iterator, Protocol

import grpc
import openai
from langchain_openai import ChatOpenAI

try:
    from . import healthcare_analytics_pb2, healthcare_analytics_pb2_grpc
    from .audit_log import AuditRecord, AuditWriteError, initialize_audit_database, write_audit_record
    from .capability_registry import CapabilityContext, load_registry, resolve_against_schema
    from .config import ConfigurationError, EngineConfig
    from .model_profiles import ModelProfile, resolve_model_profiles
    from .evidence import (
        GroundedAnswer,
        GroundingError,
        render_deterministic_summary,
        validate_grounded_answer,
    )
    from .pii_guard import inspect_outbound_payload
    from .query_planner import (
        NvidiaQueryPlanner,
        PlannerConnectionError,
        PlannerError,
        PlannerRateLimitedError,
        PlannerServiceError,
        PlannerTimeoutError,
        QueryPlan,
        QueryPlanner,
    )
    from .sql_guard import QueryTimeoutError, StructuredQueryResult, UnsafeQueryError, execute_readonly_query
except ImportError:
    import healthcare_analytics_pb2
    import healthcare_analytics_pb2_grpc
    from audit_log import AuditRecord, AuditWriteError, initialize_audit_database, write_audit_record
    from capability_registry import CapabilityContext, load_registry, resolve_against_schema
    from config import ConfigurationError, EngineConfig
    from model_profiles import ModelProfile, resolve_model_profiles
    from evidence import (
        GroundedAnswer,
        GroundingError,
        render_deterministic_summary,
        validate_grounded_answer,
    )
    from pii_guard import inspect_outbound_payload
    from query_planner import (
        NvidiaQueryPlanner,
        PlannerConnectionError,
        PlannerError,
        PlannerRateLimitedError,
        PlannerServiceError,
        PlannerTimeoutError,
        QueryPlan,
        QueryPlanner,
    )
    from sql_guard import QueryTimeoutError, StructuredQueryResult, UnsafeQueryError, execute_readonly_query


LOGGER = logging.getLogger("medorch.engine")

MAX_SQL_REPAIR_ATTEMPTS = 1

Status = healthcare_analytics_pb2.ExecutionStatus

FULL_SCHEMA_PROMPT = """Table: hospital_readmissions
Columns and their actual value semantics (verified against the bundled data,
not assumed):
- encounter_id, patient_nbr: integer identifiers. Never select these directly
  or use them in any expression, including inside aggregate functions.
- race: one of 'Caucasian', 'AfricanAmerican', 'Other', 'Asian', 'Hispanic', or NULL.
- gender: one of 'Female', 'Male', 'Unknown/Invalid'.
- age: a ten-year bracket string, one of '[0-10)', '[10-20)', ..., '[90-100)'.
- admission_type_id, discharge_disposition_id, admission_source_id: integer
  codes with no label mapping table available in this database. Do not invent
  a name for a code; only report or group by the raw integer.
- time_in_hospital: integer number of days for that encounter (NOT a
  readmission-timing indicator).
- num_lab_procedures, num_procedures, num_medications, number_outpatient,
  number_emergency, number_inpatient, number_diagnoses: integer counts for
  that encounter.
- diag_1, diag_2, diag_3: ICD-9-style diagnosis codes as text, not diagnosis names.
- max_glu_serum: one of '>300', '>200', 'Norm', or NULL (test not performed).
- a1cresult: one of '>7', '>8', 'Norm', or NULL (test not performed).
- metformin, repaglinide, nateglinide, chlorpropamide, glimepiride, acetohexamide,
  glipizide, glyburide, tolbutamide, pioglitazone, rosiglitazone, acarbose,
  miglitol, troglitazone, tolazamide, examide, citoglipton, insulin,
  glyburide_metformin, glipizide_metformin, glimepiride_pioglitazone,
  metformin_rosiglitazone, metformin_pioglitazone: one column per drug, each one of
  'No' (not prescribed), 'Steady', 'Up' (dose increased), 'Down' (dose decreased).
  "Insulin status" means the insulin column, not diabetesmed.
- change: 'Ch' (any medication changed during the stay) or 'No'.
- diabetesmed: 'Yes' or 'No'.
- readmitted: one of 'NO', '<30' (readmitted within 30 days), '>30'
  (readmitted after 30 days). This is the ONLY column that indicates
  readmission timing; time_in_hospital does not.
  Definition of "a readmission" for aggregate questions (count, rate, total)
  that do not name a specific window: readmitted != 'NO', i.e. '<30' OR '>30'
  combined. Only narrow to '<30' alone, or '>30' alone, if the user's wording
  explicitly asks for that window (e.g. "within 30 days", "readmitted early",
  "long-term readmission"). Apply this same default consistently across every
  question in a conversation — never silently switch definitions between
  similarly-worded questions.
- predicted_readmission_risk: a float between 0 and 1, precomputed once by
  an offline-trained demonstration classifier (not a live prediction, not
  clinically validated; held-out ROC-AUC is approximately 0.66 — see
  engine/ml/artifacts/readmission_risk_metrics.json for full metrics). Treat
  it only as a relative risk score for aggregate analysis, never as a
  certainty or a clinical judgment about any individual encounter.
- predicted_readmission_risk_model_version: text identifier of which trained
  model produced that score.
- predicted_readmission_risk_in_scope: 1 if the encounter was part of the
  model's modelling cohort, 0 if it ended in death or hospice discharge (those
  cannot be readmitted, so the model was neither trained nor evaluated on
  them). For aggregate analysis of predicted risk, filter to
  predicted_readmission_risk_in_scope = 1.

Write one SQLite SELECT statement using only hospital_readmissions.
Never select encounter_id or patient_nbr directly as output values. The only
exception: they may be used as the sole argument to COUNT(), including inside
a CASE expression for conditional counting (e.g. COUNT(CASE WHEN readmitted =
'<30' THEN encounter_id END)) — this is the correct way to compute a rate or
fraction. They must never appear inside MAX(), MIN(), or any other function,
in a bare SELECT, or in GROUP BY combined with being selected.
Do all arithmetic in SQL and return numbers ready to display. For any rate, share, or
percentage return a percentage rounded to 1 decimal, never a bare fraction, e.g.
ROUND(100.0 * COUNT(CASE WHEN readmitted = '<30' THEN encounter_id END) /
COUNT(encounter_id), 1) AS readmission_rate_percent. For predicted_readmission_risk
(a 0-1 probability) report ROUND(100.0 * AVG(predicted_readmission_risk), 1) AS
avg_risk_percent. Round other averages to 2 decimals with ROUND(AVG(x), 2).
Only these SQL functions are available: COUNT, AVG, SUM, MIN, MAX, ROUND, CAST,
COALESCE, IFNULL, LENGTH, LOWER, UPPER, ABS. String functions such as SUBSTR or
INSTR are NOT available. Window functions (OVER, PARTITION BY) are NOT available.
To find which group has the most or highest value, GROUP BY it, aggregate with
SUM, AVG or COUNT, ORDER BY that aggregate DESC, and add LIMIT 1 - never nest
aggregates such as MAX(SUM(x)). Always SELECT the aggregate value next to the group
name so the answer shows the figure, and for 'most' questions about a count of
events (lab procedures, visits) prefer SELECT group, SUM(x) AS total, ROUND(AVG(x), 2)
AS average_per_encounter so totals are not mistaken for per-encounter rates. Age brackets like '[0-10)' and '[90-100)' already sort in
the correct order as plain text, so use ORDER BY age (never a computed sort key).
Do not use PRAGMA, ATTACH, comments, common table expressions, or multiple statements.
Add an appropriate LIMIT for detail-row queries.
"""

# A minimal, deterministic fast-path for unequivocally unsupported requests.
# This is intentionally small: the structured planner's own supported/
# reason_code decision is the primary gate, so this list must not grow into
# a broad blocklist that rejects legitimate questions containing ambiguous
# clinical vocabulary.
_FAST_PATH_UNSUPPORTED_PHRASES = (
    "forecast",
    "what will",
    "predict the",
    "simulate",
    "hypothetical",
)

UNSUPPORTED_MESSAGE = (
    "This request cannot be answered from the available hospital_readmissions "
    "dataset without inventing information. No forecast or estimate was generated."
)

SYNTHESIS_JSON_INSTRUCTIONS = (
    "Write summary_text as a clear, natural-language explanation of what the "
    "data shows, the way you would summarize a finding for a colleague — not a "
    "bare restatement of column=value pairs. Use markdown: a short bolded "
    "headline with the key figure, then 1-3 sentences of plain-English "
    "explanation, and a bullet list only if comparing several groups. "
    "This dataset contains only historical, de-identified encounter counts — "
    "it has no clinical, socioeconomic, staffing, or causal information. If the "
    "query counts or rates 'readmissions', state in summary_text whether that means "
    "any readmission (both <30 and >30 days combined) or a specific window (within "
    "30 days only, or after 30 days only) — do not use the bare word 'readmission' "
    "without saying which. If the user's question asks WHY something happens, you "
    "must NOT invent a cause: "
    "state plainly that this data can show counts, rates, and associations but "
    "not the underlying cause, then report whichever relevant numbers ARE "
    "available so the answer is still useful.\n"
    "Respond with strict JSON only matching exactly this schema: "
    '{"summary_text": string, "numeric_claims": '
    '[{"rendered_value": string, "evidence": {"row_index": integer, "column_name": string}}]}. '
    "Every number you write in summary_text must appear as its own numeric_claims entry "
    "referencing the exact row_index and column_name it came from — rendered_value must be "
    "a single standalone number exactly as it appears in summary_text (e.g. '29', never a "
    "phrase like '29 out of 161'); if you compare two counts, add one claim per number. "
    "row_index is 0-based: the Rows list below is a JSON array, so its first element is "
    "row_index 0, the second is row_index 1, and so on — if there is only one row, its "
    "row_index is always 0, never 1. "
    "Do not perform arithmetic beyond what the columns already contain — if you want to "
    "state a rate or percentage, only do so if the SQL already returned it as its own "
    "column; otherwise compare the raw counts directly (e.g. 'X of Y encounters') instead "
    "of computing or guessing a percentage. "
    "Do not include markdown fences around the JSON itself, or any explanation outside the JSON object."
)


class LanguageModel(Protocol):
    def invoke(self, prompt: str) -> Any: ...

    def stream(self, prompt: str) -> Iterator[Any]: ...


def create_language_model(config: EngineConfig) -> ChatOpenAI:
    return ChatOpenAI(
        base_url=config.base_url,
        api_key=config.api_key,
        model=config.model,
        temperature=0,
        max_tokens=4096,
        max_retries=0,
        timeout=config.llm_timeout_seconds,
    )


def _context_guidance(context: CapabilityContext) -> str:
    limitations = "\n".join(f"- {item}" for item in context.safety_limitations)
    return (
        f"Selected context: {context.display_name}\n{context.description}\n"
        f"Limitations for this context:\n{limitations}\n"
    )


class Outcome:
    """Mutable holder for the single terminal outcome of one request, so a
    finally block can write exactly one audit record regardless of which
    code path produced it."""

    def __init__(self, query_id: str, requester_type: str, context_id: str, model_version: str) -> None:
        self.audit_id = f"audit-{uuid.uuid4().hex}"
        self.query_id = query_id
        self.requester_type = requester_type
        self.context_id = context_id
        self.model_version = model_version
        self.executed_sql: str | None = None
        self.execution_status = "EXECUTION_STATUS_ERROR"
        self.row_count: int | None = None
        self.result_truncated = False
        self.pii_detected = False
        self.pii_redacted = False
        self.error_code: str | None = None


class AnalyticsEngineServicer(healthcare_analytics_pb2_grpc.AnalyticsEngineServicer):
    def __init__(
        self,
        config: EngineConfig,
        llm: LanguageModel,
        planner: QueryPlanner | None = None,
        profile_clients: dict[str, tuple[LanguageModel, QueryPlanner, str]] | None = None,
    ):
        self.config = config
        self.llm = llm
        self.planner = planner or NvidiaQueryPlanner(llm, model_version=config.model, max_retries=2)

        profiles = resolve_model_profiles(config)
        self._profiles_by_id: dict[str, ModelProfile] = {profile.id: profile for profile in profiles}
        if profile_clients is not None:
            # Test injection point — mirrors the `planner` parameter above,
            # so a test can inject fakes for named profiles too instead of
            # the real ChatOpenAI clients built below ever making a network
            # call. See AnalyticsEngineServicer tests for usage.
            self._profile_clients = profile_clients
        else:
            self._profile_clients = {}
            for profile in profiles:
                if not profile.available:
                    continue
                profile_llm = ChatOpenAI(
                    base_url=profile.base_url,
                    api_key=profile.api_key,
                    model=profile.model,
                    temperature=0,
                    max_tokens=4096,
                    max_retries=0,
                    timeout=config.llm_timeout_seconds,
                )
                profile_planner = NvidiaQueryPlanner(profile_llm, model_version=profile.model, max_retries=2)
                self._profile_clients[profile.id] = (profile_llm, profile_planner, profile.model)

        contexts = load_registry()
        self.contexts: dict[str, CapabilityContext] = {
            context.id: context
            for context in resolve_against_schema(contexts, config.database_path)
        }
        initialize_audit_database(config.audit_database_path)

    def _terminal(
        self,
        request: Any,
        outcome: Outcome,
        summary: str,
        *,
        status: "healthcare_analytics_pb2.ExecutionStatus",
        error_code: str = "",
        visualization: dict[str, Any] | None = None,
    ) -> healthcare_analytics_pb2.InsightResponse:
        payload = inspect_outbound_payload(summary, json.dumps(visualization or {}))
        if payload.pii_detected and not payload.pii_scrubbed:
            outcome.execution_status = "EXECUTION_STATUS_ERROR"
            outcome.error_code = "IDENTIFIER_EXPOSURE"
            outcome.pii_detected = True
            outcome.pii_redacted = False
            return healthcare_analytics_pb2.InsightResponse(
                response_id=f"resp-{request.query_id}",
                summary_text="The response could not be safely returned because it contained protected identifiers.",
                visualization_data_json="{}",
                execution_status=Status.EXECUTION_STATUS_ERROR,
                model_version=outcome.model_version,
                audit_id=outcome.audit_id,
                is_final=True,
                error_code="IDENTIFIER_EXPOSURE",
                pii_detected=True,
                pii_redacted=False,
                pii_scrubbed=False,
            )

        outcome.execution_status = healthcare_analytics_pb2.ExecutionStatus.Name(status)
        outcome.error_code = error_code or None
        outcome.pii_detected = payload.pii_detected
        outcome.pii_redacted = payload.pii_redacted
        return healthcare_analytics_pb2.InsightResponse(
            response_id=f"resp-{request.query_id}",
            summary_text=payload.summary_text,
            visualization_data_json=payload.visualization_data_json,
            executed_sql=outcome.executed_sql or "",
            execution_status=status,
            model_version=outcome.model_version,
            audit_id=outcome.audit_id,
            is_final=True,
            error_code=error_code,
            pii_detected=payload.pii_detected,
            pii_redacted=payload.pii_redacted,
            pii_scrubbed=payload.pii_scrubbed,
        )

    def _analyzing(self, request: Any, outcome: Outcome, message: str) -> healthcare_analytics_pb2.InsightResponse:
        return healthcare_analytics_pb2.InsightResponse(
            response_id=f"resp-{request.query_id}",
            summary_text=message,
            visualization_data_json="{}",
            execution_status=Status.EXECUTION_STATUS_ANALYZING,
            model_version=outcome.model_version,
            audit_id=outcome.audit_id,
            is_final=False,
            pii_scrubbed=False,
        )

    def ProcessQuery(self, request: Any, context: grpc.ServicerContext):
        prompt = request.natural_language_prompt.strip()
        context_id = request.agent_target or "general"
        requester_type = request.user_role or "unauthenticated-demo"
        requested_profile_id = (request.model_profile_id or "").strip()

        if requested_profile_id and requested_profile_id in self._profile_clients:
            active_llm, active_planner, active_model_version = self._profile_clients[requested_profile_id]
        else:
            # No profile requested: unchanged default behavior from before
            # model profiles existed — the engine's single NVIDIA_*-
            # configured client. A *named but unavailable or unrecognized*
            # profile id is deliberately NOT substituted here; it is
            # rejected explicitly below with a clear reason, since silently
            # answering with a different model than the one the user
            # selected would be a more deceptive failure than an error.
            active_llm, active_planner, active_model_version = self.llm, self.planner, self.config.model

        outcome = Outcome(request.query_id, requester_type, context_id, active_model_version)

        try:
            if not prompt:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Prompt must not be empty")

            LOGGER.info("Received query %s for context %s", request.query_id, context_id)

            if requested_profile_id and requested_profile_id not in self._profile_clients:
                unavailable = self._profiles_by_id.get(requested_profile_id)
                reason = (
                    unavailable.unavailable_reason
                    if unavailable is not None
                    else "that model is not recognized"
                )
                yield self._terminal(
                    request, outcome, f"The requested model is not available right now: {reason}.",
                    status=Status.EXECUTION_STATUS_ERROR, error_code="MODEL_UNAVAILABLE",
                )
                return

            yield self._analyzing(request, outcome, "Analyzing the available de-identified encounter data...")

            capability = self.contexts.get(context_id)
            if capability is None:
                yield self._terminal(
                    request, outcome, "Unknown analytics context requested.",
                    status=Status.EXECUTION_STATUS_REJECTED, error_code="UNKNOWN_CONTEXT",
                )
                return
            if not capability.available:
                reason = capability.unavailable_reason or "This context has no supported data source."
                suggestions = "; ".join(capability.suggested_prompts) or "See the general context for supported questions."
                yield self._terminal(
                    request, outcome,
                    f"{reason} Try a supported question instead, for example: {suggestions}",
                    status=Status.EXECUTION_STATUS_UNSUPPORTED, error_code="CONTEXT_UNAVAILABLE",
                )
                return

            lower_prompt = prompt.lower()
            if any(phrase in lower_prompt for phrase in _FAST_PATH_UNSUPPORTED_PHRASES):
                yield self._terminal(
                    request, outcome, UNSUPPORTED_MESSAGE,
                    status=Status.EXECUTION_STATUS_UNSUPPORTED, error_code="UNSUPPORTED_REQUEST",
                )
                return

            if not context.is_active():
                outcome.execution_status = "EXECUTION_STATUS_CANCELLED"
                return

            try:
                plan: QueryPlan = active_planner.plan(prompt, context_id, FULL_SCHEMA_PROMPT + _context_guidance(capability))
            except PlannerTimeoutError:
                yield self._terminal(
                    request, outcome, "The analytics assistant timed out while planning this request.",
                    status=Status.EXECUTION_STATUS_TIMEOUT, error_code="MODEL_TIMEOUT",
                )
                return
            except PlannerConnectionError:
                LOGGER.error("LLM endpoint unreachable for %s", request.query_id, exc_info=True)
                yield self._terminal(
                    request, outcome,
                    "The AI service is currently unreachable. If you're running a local model, "
                    "make sure it is started, then try again.",
                    status=Status.EXECUTION_STATUS_ERROR, error_code="MODEL_UNAVAILABLE",
                )
                return
            except PlannerRateLimitedError:
                LOGGER.error("LLM endpoint rate-limited request %s", request.query_id, exc_info=True)
                yield self._terminal(
                    request, outcome,
                    "The configured AI provider has rejected this request for exceeding its "
                    "rate or quota limit. This is not an error in your question — the provider "
                    "needs time (often measured in hours on a free tier) before it will accept "
                    "new requests again.",
                    status=Status.EXECUTION_STATUS_ERROR, error_code="MODEL_RATE_LIMITED",
                )
                return
            except PlannerServiceError:
                LOGGER.error("LLM endpoint returned a server error for %s", request.query_id, exc_info=True)
                yield self._terminal(
                    request, outcome,
                    "The AI service returned an internal error and could not process this "
                    "request. For a local model this often means the host doesn't have enough "
                    "free memory to load it right now; for a hosted model it usually means the "
                    "provider is temporarily overloaded. Try again in a moment.",
                    status=Status.EXECUTION_STATUS_ERROR, error_code="MODEL_SERVICE_ERROR",
                )
                return
            except PlannerError:
                LOGGER.warning("Planner failed for %s", request.query_id, exc_info=True)
                yield self._terminal(
                    request, outcome, "The analytics assistant could not produce a valid plan for this request.",
                    status=Status.EXECUTION_STATUS_ERROR, error_code="INVALID_MODEL_OUTPUT",
                )
                return

            if not plan.supported:
                yield self._terminal(
                    request, outcome, plan.user_message,
                    status=Status.EXECUTION_STATUS_UNSUPPORTED, error_code="UNSUPPORTED_REQUEST",
                )
                return

            if not context.is_active():
                outcome.execution_status = "EXECUTION_STATUS_CANCELLED"
                return

            result: StructuredQueryResult | None = None
            for attempt in range(MAX_SQL_REPAIR_ATTEMPTS + 1):
                try:
                    result = execute_readonly_query(
                        self.config.database_path,
                        plan.sql or "",
                        row_limit=self.config.query_row_limit,
                        timeout_seconds=self.config.query_timeout_seconds,
                        column_limit=self.config.query_column_limit,
                        max_sql_length=self.config.sql_max_length,
                    )
                    break
                except QueryTimeoutError:
                    yield self._terminal(
                        request, outcome, "The query took too long to run against the historical dataset.",
                        status=Status.EXECUTION_STATUS_TIMEOUT, error_code="QUERY_TIMEOUT",
                    )
                    return
                except UnsafeQueryError as exc:
                    LOGGER.warning("Rejected generated SQL for %s (attempt %d)", request.query_id, attempt + 1, exc_info=True)
                    repaired = self._repair_plan(active_planner, prompt, context_id, capability, exc) if attempt < MAX_SQL_REPAIR_ATTEMPTS else None
                    if repaired is None:
                        yield self._terminal(
                            request, outcome, UNSUPPORTED_MESSAGE,
                            status=Status.EXECUTION_STATUS_REJECTED, error_code="UNSAFE_SQL",
                        )
                        return
                    plan = repaired

            assert result is not None

            outcome.executed_sql = result.executed_sql
            outcome.row_count = result.row_count
            outcome.result_truncated = result.truncated

            if not context.is_active():
                outcome.execution_status = "EXECUTION_STATUS_CANCELLED"
                return

            deterministic = render_deterministic_summary(result, prompt)
            # Only skip narrative synthesis for genuinely trivial shapes (no
            # rows, or a single bare number) where prose adds nothing. Every
            # other result gets a real explanation attempt first; the
            # deterministic table caption is a silent fallback if that
            # attempt can't be verified against the actual data, never a
            # user-facing error — asking a question the assistant can
            # technically answer should not fail just because the narrative
            # pass didn't pan out.
            is_trivial = result.row_count == 0 or (len(result.columns) == 1 and result.row_count == 1)
            if is_trivial:
                summary_text = deterministic.text
            else:
                try:
                    summary_text = self._synthesize_grounded_answer(active_llm, prompt, capability, result)
                except (GroundingError, PlannerTimeoutError, PlannerError) as exc:
                    LOGGER.info(
                        "Narrative synthesis unavailable for %s (%s); falling back to deterministic summary",
                        request.query_id, type(exc).__name__,
                    )
                    summary_text = deterministic.text if deterministic is not None else UNSUPPORTED_MESSAGE

            yield self._terminal(
                request, outcome, summary_text,
                status=Status.EXECUTION_STATUS_OK,
                visualization=result.to_json_safe(),
            )
        except Exception:
            LOGGER.exception("Unhandled error processing %s", request.query_id)
            outcome.execution_status = "EXECUTION_STATUS_ERROR"
            outcome.error_code = "INTERNAL_ERROR"
            try:
                yield self._terminal(
                    request, outcome, "The analytics service could not complete this request.",
                    status=Status.EXECUTION_STATUS_ERROR, error_code="INTERNAL_ERROR",
                )
            except Exception:  # pragma: no cover - stream already broken
                pass
        finally:
            try:
                write_audit_record(
                    self.config.audit_database_path,
                    AuditRecord(
                        audit_id=outcome.audit_id,
                        query_id=outcome.query_id,
                        requester_type=outcome.requester_type,
                        selected_context=outcome.context_id,
                        prompt=prompt,
                        executed_sql=outcome.executed_sql,
                        execution_status=outcome.execution_status,
                        row_count=outcome.row_count,
                        result_truncated=outcome.result_truncated,
                        model_version=outcome.model_version,
                        pii_detected=outcome.pii_detected,
                        pii_redacted=outcome.pii_redacted,
                        error_code=outcome.error_code,
                    ),
                )
            except AuditWriteError:
                LOGGER.error("Audit write failed for %s", outcome.query_id)

    def _repair_plan(
        self, planner: QueryPlanner, prompt: str, context_id: str, capability: CapabilityContext, error: Exception
    ) -> QueryPlan | None:
        """Give the planner one chance to rewrite SQL the guard rejected, telling it
        why. The rewrite still goes through the full guard; any failure here just
        falls back to the original rejection."""
        correction = (
            f"{prompt}\n\n[Correction] Your previous SQL was rejected by the safety checker: {error}. "
            "Write a different single SELECT that answers the question using only the allowed functions. "
            "Window functions (OVER, PARTITION BY) do not exist here: to find the group with the most or "
            "highest value, GROUP BY it, aggregate, ORDER BY the aggregate DESC, and LIMIT 1."
        )
        try:
            repaired = planner.plan(correction, context_id, FULL_SCHEMA_PROMPT + _context_guidance(capability))
        except Exception:
            LOGGER.warning("SQL repair attempt failed", exc_info=True)
            return None
        return repaired if repaired.supported and repaired.sql else None

    def _synthesize_grounded_answer(
        self, llm: LanguageModel, prompt: str, capability: CapabilityContext, result: StructuredQueryResult
    ) -> str:
        columns_desc = ", ".join(result.columns)
        rows_desc = json.dumps([list(row) for row in result.rows])
        synthesis_prompt = (
            f"{_context_guidance(capability)}\n{SYNTHESIS_JSON_INSTRUCTIONS}\n"
            f"User request: {prompt}\nColumns: {columns_desc}\nRows: {rows_desc}\nJSON:"
        )
        try:
            response = llm.invoke(synthesis_prompt)
        except (openai.APITimeoutError, TimeoutError) as exc:
            raise PlannerTimeoutError("Synthesis request timed out") from exc
        except openai.OpenAIError as exc:
            raise PlannerError(f"Synthesis request failed: {exc}") from exc

        raw_text = str(response.content).strip()
        raw_text = raw_text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            payload = json.loads(raw_text)
            answer = GroundedAnswer.model_validate(payload)
        except Exception as exc:
            raise PlannerError(f"Synthesis output failed schema validation: {exc}") from exc
        return validate_grounded_answer(answer, result, prompt)


def serve(config: EngineConfig | None = None) -> None:
    resolved_config = config or EngineConfig.from_env()
    llm = create_language_model(resolved_config)
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    healthcare_analytics_pb2_grpc.add_AnalyticsEngineServicer_to_server(
        AnalyticsEngineServicer(resolved_config, llm), server
    )
    address = f"{resolved_config.host}:{resolved_config.port}"
    if server.add_insecure_port(address) == 0:
        raise RuntimeError(f"Unable to bind the AI engine to {address}")
    LOGGER.info("Python analytics engine listening on %s", address)
    server.start()
    server.wait_for_termination()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    try:
        serve()
    except ConfigurationError as exc:
        LOGGER.error("Configuration error: %s", exc)
        sys.exit(2)

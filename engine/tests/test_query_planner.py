import httpx
import openai
import pytest

from engine.query_planner import (
    NvidiaQueryPlanner,
    PlannerConnectionError,
    PlannerError,
    PlannerServiceError,
    PlannerTimeoutError,
    QueryPlan,
    parse_plan_json,
)


def test_supported_plan_requires_sql() -> None:
    with pytest.raises(ValueError):
        QueryPlan(supported=True, reason_code="supported", sql=None, user_message="ok")


def test_supported_plan_with_omitted_user_message_parses() -> None:
    """Regression test: a real local model omitted user_message entirely on
    a supported plan (its own view was there was 'nothing to say'), and the
    field being required with no default turned that into a schema
    validation failure, which then burned through all retries and took the
    request past the frontend's overall deadline. user_message defaults to
    "" and is never read for a supported plan, so this must succeed."""
    plan = parse_plan_json(
        '{"supported": true, "reason_code": "supported", '
        '"sql": "SELECT COUNT(*) FROM hospital_readmissions"}'
    )
    assert plan.supported is True
    assert plan.user_message == ""


def test_supported_plan_with_explicit_null_user_message_parses() -> None:
    """Same underlying issue as the omitted-field case above, but some
    models (observed with qwen2.5:14b-instruct on 3 of 4 real prompts)
    write user_message explicitly as JSON null rather than omitting it —
    arguably more spec-compliant, but a plain default value does not catch
    an explicit None, only a missing key. A field_validator normalizes it."""
    plan = parse_plan_json(
        '{"supported": true, "reason_code": "supported", '
        '"sql": "SELECT COUNT(*) FROM hospital_readmissions", "user_message": null}'
    )
    assert plan.supported is True
    assert plan.user_message == ""


def test_unsupported_plan_requires_a_user_message() -> None:
    with pytest.raises(ValueError, match="user_message"):
        QueryPlan(supported=False, reason_code="unrelated_request", sql=None, user_message="")


def test_unsupported_plan_must_not_include_sql() -> None:
    with pytest.raises(ValueError):
        QueryPlan(
            supported=False,
            reason_code="unrelated_request",
            sql="SELECT 1",
            user_message="no",
        )


def test_valid_supported_plan_parses() -> None:
    plan = parse_plan_json(
        '{"supported": true, "reason_code": "supported", '
        '"sql": "SELECT COUNT(*) FROM hospital_readmissions", "user_message": "ok"}'
    )
    assert plan.supported is True
    assert plan.sql == "SELECT COUNT(*) FROM hospital_readmissions"


def test_valid_unsupported_plan_parses() -> None:
    plan = parse_plan_json(
        '{"supported": false, "reason_code": "missing_data", "sql": null, '
        '"user_message": "Billing data is not available."}'
    )
    assert plan.supported is False
    assert plan.sql is None


def test_malformed_json_raises_planner_error() -> None:
    with pytest.raises(PlannerError, match="valid JSON"):
        parse_plan_json("not json at all")


def test_schema_violation_raises_planner_error() -> None:
    with pytest.raises(PlannerError, match="schema validation"):
        parse_plan_json('{"supported": "yes"}')


class _FakeMessage:
    def __init__(self, content: str) -> None:
        self.content = content


class _FakeLLM:
    def __init__(self, responses: list[str]) -> None:
        self._responses = list(responses)

    def invoke(self, prompt: str) -> _FakeMessage:
        return _FakeMessage(self._responses.pop(0))


class _TimeoutLLM:
    def invoke(self, prompt: str) -> _FakeMessage:
        raise TimeoutError("simulated model timeout")


def test_adapter_strips_markdown_fences_and_parses() -> None:
    llm = _FakeLLM([
        '```json\n{"supported": true, "reason_code": "supported", '
        '"sql": "SELECT COUNT(*) FROM hospital_readmissions", "user_message": "ok"}\n```'
    ])
    planner = NvidiaQueryPlanner(llm, model_version="test-model")
    plan = planner.plan("count encounters", "general", "schema")
    assert plan.supported is True


def test_adapter_retries_once_on_malformed_output() -> None:
    llm = _FakeLLM([
        "not json",
        '{"supported": false, "reason_code": "invalid_request", "sql": null, "user_message": "no"}',
    ])
    planner = NvidiaQueryPlanner(llm, model_version="test-model", max_retries=1)
    plan = planner.plan("gibberish", "general", "schema")
    assert plan.supported is False


def test_adapter_raises_planner_error_after_exhausting_retries() -> None:
    llm = _FakeLLM(["not json", "still not json"])
    planner = NvidiaQueryPlanner(llm, model_version="test-model", max_retries=1)
    with pytest.raises(PlannerError):
        planner.plan("gibberish", "general", "schema")


def test_adapter_maps_model_timeout_to_planner_timeout() -> None:
    planner = NvidiaQueryPlanner(_TimeoutLLM(), model_version="test-model")
    with pytest.raises(PlannerTimeoutError):
        planner.plan("count encounters", "general", "schema")


class _UnreachableLLM:
    """Reproduces a real incident: Ollama wasn't running, so every call
    failed with a connection error. The adapter previously caught this via
    the generic `except openai.OpenAIError` branch, retried once, then
    raised a plain PlannerError — surfacing as the misleading
    INVALID_MODEL_OUTPUT error code to the user, identical to what a
    genuinely malformed model response produces, even though the two need
    completely different fixes (start the service vs. rephrase the
    question)."""

    def __init__(self) -> None:
        self.invoke_calls = 0

    def invoke(self, prompt: str) -> _FakeMessage:
        self.invoke_calls += 1
        raise openai.APIConnectionError(request=httpx.Request("POST", "http://localhost:11434/v1"))


def test_adapter_maps_unreachable_endpoint_to_connection_error_without_retry() -> None:
    llm = _UnreachableLLM()
    planner = NvidiaQueryPlanner(llm, model_version="test-model", max_retries=2)
    with pytest.raises(PlannerConnectionError):
        planner.plan("count encounters", "general", "schema")
    assert llm.invoke_calls == 1  # a dead connection won't self-heal mid-retry-loop


class _OutOfMemoryLLM:
    """Reproduces a real incident: Ollama returned HTTP 500 with 'model
    requires more system memory (6.1 GiB) than is available (3.6 GiB)'.
    openai.InternalServerError is not a subclass of APIConnectionError (the
    request succeeded; the server rejected it), so it was previously falling
    through to the generic retry-then-PlannerError path and surfacing as
    the same misleading INVALID_MODEL_OUTPUT as a malformed JSON response,
    even though the fix (free up memory) is completely different."""

    def __init__(self) -> None:
        self.invoke_calls = 0

    def invoke(self, prompt: str) -> _FakeMessage:
        self.invoke_calls += 1
        request = httpx.Request("POST", "http://localhost:11434/v1/chat/completions")
        response = httpx.Response(500, request=request, json={"error": {"message": "out of memory"}})
        raise openai.InternalServerError("server error", response=response, body=None)


def test_adapter_maps_server_error_to_service_error_without_retry() -> None:
    llm = _OutOfMemoryLLM()
    planner = NvidiaQueryPlanner(llm, model_version="test-model", max_retries=2)
    with pytest.raises(PlannerServiceError):
        planner.plan("count encounters", "general", "schema")
    assert llm.invoke_calls == 1  # a memory shortage won't self-heal mid-retry-loop


class _OpenAITimeoutLLM:
    """Reproduces a real regression: the OpenAI SDK raises its own
    openai.APITimeoutError on a slow/unreachable NIM endpoint, which is not
    a subclass of the builtin TimeoutError. An earlier version of the
    adapter only caught TimeoutError, so this escaped uncaught all the way
    to the servicer's generic exception handler and surfaced as
    EXECUTION_STATUS_ERROR / INTERNAL_ERROR instead of a clean timeout."""

    def invoke(self, prompt: str) -> _FakeMessage:
        raise openai.APITimeoutError(request=httpx.Request("POST", "https://example.com"))


def test_adapter_maps_openai_api_timeout_to_planner_timeout() -> None:
    planner = NvidiaQueryPlanner(_OpenAITimeoutLLM(), model_version="test-model")
    with pytest.raises(PlannerTimeoutError):
        planner.plan("count encounters", "general", "schema")


class _OpenAIErrorLLM:
    def invoke(self, prompt: str) -> _FakeMessage:
        raise openai.APIConnectionError(request=httpx.Request("POST", "https://example.com"))


def test_adapter_maps_other_openai_errors_to_planner_error_with_retry() -> None:
    planner = NvidiaQueryPlanner(_OpenAIErrorLLM(), model_version="test-model", max_retries=1)
    with pytest.raises(PlannerError):
        planner.plan("count encounters", "general", "schema")

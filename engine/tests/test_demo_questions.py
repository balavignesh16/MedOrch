from __future__ import annotations

import json
import sqlite3
from pathlib import Path

import pytest

from engine.config import PROJECT_ROOT
from engine.sql_guard import execute_readonly_query, validate_readonly_query

QUESTIONS_PATH = PROJECT_ROOT / "config" / "demo_questions.json"
CAPABILITIES_PATH = PROJECT_ROOT / "config" / "assistant_capabilities.json"
DATABASE_PATH = PROJECT_ROOT / "database" / "medorch.db"

QUESTIONS = json.loads(QUESTIONS_PATH.read_text(encoding="utf-8"))["questions"]


def test_curated_list_is_well_formed() -> None:
    assert 8 <= len(QUESTIONS) <= 14
    assert len({q["id"] for q in QUESTIONS}) == len(QUESTIONS)
    assert len({q["prompt"] for q in QUESTIONS}) == len(QUESTIONS)
    for question in QUESTIONS:
        assert set(question) == {"id", "context", "prompt", "expected_sql"}
        assert question["prompt"].endswith(("?", "status", "result"))


@pytest.mark.parametrize("question", QUESTIONS, ids=[q["id"] for q in QUESTIONS])
def test_reference_sql_passes_the_guard(question: dict) -> None:
    validate_readonly_query(question["expected_sql"], {"hospital_readmissions"})


@pytest.mark.skipif(not DATABASE_PATH.is_file(), reason="bundled database not present")
@pytest.mark.parametrize("question", QUESTIONS, ids=[q["id"] for q in QUESTIONS])
def test_reference_sql_runs_on_the_real_schema_and_returns_rows(question: dict) -> None:
    with sqlite3.connect(DATABASE_PATH) as connection:
        columns = {row[1] for row in connection.execute("PRAGMA table_info(hospital_readmissions)")}
    if "predicted_readmission_risk" not in columns:
        pytest.skip("database has not been scored yet")
    result = execute_readonly_query(DATABASE_PATH.resolve(), question["expected_sql"], row_limit=100, timeout_seconds=30)
    assert result.row_count >= 1


def test_every_suggested_prompt_is_a_curated_and_tested_question() -> None:
    capabilities = json.loads(CAPABILITIES_PATH.read_text(encoding="utf-8"))["contexts"]
    curated = {(q["context"], q["prompt"]) for q in QUESTIONS}
    for context in capabilities:
        for prompt in context["suggested_prompts"]:
            assert (context["id"], prompt) in curated, f"{context['id']}: '{prompt}' is not in demo_questions.json"


def test_every_available_context_suggests_its_curated_questions() -> None:
    capabilities = {c["id"]: c for c in json.loads(CAPABILITIES_PATH.read_text(encoding="utf-8"))["contexts"]}
    for context_id in ("general", "clinical", "operations", "predictive"):
        expected = [q["prompt"] for q in QUESTIONS if q["context"] == context_id]
        assert capabilities[context_id]["suggested_prompts"] == expected

from pathlib import Path
import sqlite3

import pytest

from engine import config as engine_config
from engine.capability_registry import (
    DEFAULT_REGISTRY_PATH,
    RegistryError,
    load_registry,
    resolve_against_schema,
)


def test_default_registry_loads_and_declares_expected_contexts() -> None:
    contexts = load_registry()
    ids = {context.id for context in contexts}
    assert {"general", "clinical", "operations", "billing"} <= ids

    billing = next(context for context in contexts if context.id == "billing")
    assert billing.available is False
    assert billing.unavailable_reason


def test_default_registry_matches_the_bundled_database_schema() -> None:
    """Startup/test check: declared tables and columns must exist for
    every context the registry claims is available."""
    contexts = load_registry()
    resolved = resolve_against_schema(contexts, engine_config.PROJECT_ROOT / "database/medorch.db")

    for original, checked in zip(contexts, resolved):
        if original.available:
            assert checked.available is True, (
                f"Context '{original.id}' is declared available but its required "
                f"columns/tables are missing from the bundled database: "
                f"{checked.unavailable_reason}"
            )


def test_missing_registry_file_raises_actionable_error(tmp_path: Path) -> None:
    with pytest.raises(RegistryError, match="not found"):
        load_registry(tmp_path / "missing.json")


def test_malformed_registry_json_raises_actionable_error(tmp_path: Path) -> None:
    bad_file = tmp_path / "bad.json"
    bad_file.write_text("{not valid json", encoding="utf-8")
    with pytest.raises(RegistryError, match="not valid JSON"):
        load_registry(bad_file)


def test_context_missing_required_table_is_disabled_with_reason(tmp_path: Path) -> None:
    registry_file = tmp_path / "registry.json"
    registry_file.write_text(
        """
        {"contexts": [{
            "id": "ghost",
            "display_name": "Ghost",
            "description": "References a table that does not exist.",
            "available": true,
            "required_tables": ["nonexistent_table"],
            "required_columns": ["some_column"],
            "suggested_prompts": [],
            "unsupported_examples": [],
            "safety_limitations": []
        }]}
        """,
        encoding="utf-8",
    )
    database_path = tmp_path / "test.db"
    with sqlite3.connect(database_path) as connection:
        connection.execute("CREATE TABLE hospital_readmissions (encounter_id INTEGER)")

    contexts = load_registry(registry_file)
    resolved = resolve_against_schema(contexts, database_path)

    assert resolved[0].available is False
    assert "nonexistent_table" in resolved[0].unavailable_reason


def test_context_missing_required_column_is_disabled_with_reason(tmp_path: Path) -> None:
    registry_file = tmp_path / "registry.json"
    registry_file.write_text(
        """
        {"contexts": [{
            "id": "partial",
            "display_name": "Partial",
            "description": "References a column that does not exist.",
            "available": true,
            "required_tables": ["hospital_readmissions"],
            "required_columns": ["encounter_id", "claim_amount"],
            "suggested_prompts": [],
            "unsupported_examples": [],
            "safety_limitations": []
        }]}
        """,
        encoding="utf-8",
    )
    database_path = tmp_path / "test.db"
    with sqlite3.connect(database_path) as connection:
        connection.execute("CREATE TABLE hospital_readmissions (encounter_id INTEGER)")

    contexts = load_registry(registry_file)
    resolved = resolve_against_schema(contexts, database_path)

    assert resolved[0].available is False
    assert "claim_amount" in resolved[0].unavailable_reason


def test_already_unavailable_context_is_left_unchanged(tmp_path: Path) -> None:
    contexts = load_registry(DEFAULT_REGISTRY_PATH)
    database_path = tmp_path / "test.db"
    with sqlite3.connect(database_path) as connection:
        connection.execute("CREATE TABLE hospital_readmissions (encounter_id INTEGER)")

    resolved = resolve_against_schema(contexts, database_path)
    billing = next(context for context in resolved if context.id == "billing")
    assert billing.unavailable_reason == "The bundled hospital_readmissions table has no billing or claims columns."

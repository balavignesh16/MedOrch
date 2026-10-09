from pathlib import Path
import sqlite3

from engine.audit_log import AuditRecord, initialize_audit_database, write_audit_record


def _record(**overrides) -> AuditRecord:
    defaults = dict(
        audit_id="audit-1",
        query_id="q-1",
        requester_type="unauthenticated-demo",
        selected_context="general",
        prompt="How many encounters were readmitted?",
        executed_sql="SELECT COUNT(*) FROM hospital_readmissions;",
        execution_status="EXECUTION_STATUS_OK",
        row_count=1,
        result_truncated=False,
        model_version="test-model",
        pii_detected=False,
        pii_redacted=False,
    )
    defaults.update(overrides)
    return AuditRecord(**defaults)


def test_write_creates_database_and_record(tmp_path: Path) -> None:
    db_path = tmp_path / "audit.db"
    initialize_audit_database(db_path)
    write_audit_record(db_path, _record())

    with sqlite3.connect(db_path) as connection:
        row = connection.execute("SELECT * FROM audit_log WHERE audit_id = 'audit-1'").fetchone()
    assert row is not None


def test_raw_prompt_is_never_stored(tmp_path: Path) -> None:
    db_path = tmp_path / "audit.db"
    initialize_audit_database(db_path)
    write_audit_record(db_path, _record(prompt="patient_nbr 99999 readmission"))

    with sqlite3.connect(db_path) as connection:
        row = connection.execute(
            "SELECT prompt_sha256, prompt_redacted_excerpt FROM audit_log WHERE audit_id = 'audit-1'"
        ).fetchone()
    prompt_hash, excerpt = row
    assert len(prompt_hash) == 64
    assert "99999" not in (excerpt or "")


def test_result_rows_are_never_stored_only_count(tmp_path: Path) -> None:
    db_path = tmp_path / "audit.db"
    initialize_audit_database(db_path)
    write_audit_record(db_path, _record(row_count=3))

    with sqlite3.connect(db_path) as connection:
        columns = {row[1] for row in connection.execute("PRAGMA table_info(audit_log)").fetchall()}
    assert "result_rows" not in columns
    assert "row_count" in columns


def test_covers_all_terminal_outcomes(tmp_path: Path) -> None:
    db_path = tmp_path / "audit.db"
    initialize_audit_database(db_path)
    outcomes = [
        "EXECUTION_STATUS_OK",
        "EXECUTION_STATUS_UNSUPPORTED",
        "EXECUTION_STATUS_REJECTED",
        "EXECUTION_STATUS_TIMEOUT",
        "EXECUTION_STATUS_CANCELLED",
        "EXECUTION_STATUS_ERROR",
    ]
    for index, status in enumerate(outcomes):
        write_audit_record(db_path, _record(audit_id=f"audit-{index}", execution_status=status))

    with sqlite3.connect(db_path) as connection:
        count = connection.execute("SELECT COUNT(*) FROM audit_log").fetchone()[0]
    assert count == len(outcomes)


def test_database_lives_outside_analytics_allowlist() -> None:
    """The audit database file name is distinct from the analytics database
    so the SQL guard's table allowlist (hospital_readmissions only) can
    never resolve to it, and it is a separate SQLite file entirely."""
    from engine.sql_guard import ALLOWED_TABLE

    assert ALLOWED_TABLE == "hospital_readmissions"

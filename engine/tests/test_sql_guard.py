from pathlib import Path
import sqlite3

import pytest

from engine.sql_guard import (
    QueryTimeoutError,
    UnsafeQueryError,
    execute_readonly_query,
    validate_readonly_query,
)


def create_database(path: Path) -> None:
    with sqlite3.connect(path) as connection:
        connection.execute(
            "CREATE TABLE hospital_readmissions (encounter_id INTEGER, readmitted TEXT)"
        )
        connection.executemany(
            "INSERT INTO hospital_readmissions VALUES (?, ?)",
            [(1, "NO"), (2, "<30"), (2, ">30"), (3, ">30")],
        )


@pytest.mark.parametrize(
    "query",
    [
        "DELETE FROM hospital_readmissions",
        "PRAGMA table_info(hospital_readmissions)",
        "SELECT * FROM hospital_readmissions; DROP TABLE hospital_readmissions",
        "SELECT * FROM patients",
        "SELECT * FROM readmission_risk_explanations",
        "SELECT feature FROM hospital_readmissions JOIN readmission_risk_explanations USING (encounter_id)",
        "SELECT 1",
    ],
)
def test_rejects_unsafe_or_unscoped_queries(query: str) -> None:
    with pytest.raises(UnsafeQueryError):
        validate_readonly_query(query, {"hospital_readmissions"})


def test_executes_readonly_query_with_row_limit(tmp_path: Path) -> None:
    database_path = tmp_path / "test.db"
    create_database(database_path)

    result = execute_readonly_query(
        database_path,
        "SELECT readmitted FROM hospital_readmissions ORDER BY readmitted",
        row_limit=2,
        timeout_seconds=1,
    )

    assert result.rows == [("<30",), (">30",)]
    assert result.truncated is True
    assert result.columns == ("readmitted",)
    assert result.source_table == "hospital_readmissions"


def test_rejects_direct_identifier_column_selection(tmp_path: Path) -> None:
    database_path = tmp_path / "test.db"
    create_database(database_path)

    with pytest.raises(UnsafeQueryError, match="identifier column"):
        execute_readonly_query(
            database_path,
            "SELECT encounter_id FROM hospital_readmissions",
            row_limit=10,
            timeout_seconds=1,
        )


def test_permits_identifier_column_as_sole_count_argument(tmp_path: Path) -> None:
    """Regression: a real model (qwen2.5:14b) reliably produced
    COUNT(encounter_id) for rate questions ('what fraction of X were
    readmitted') — an extremely common, genuinely safe SQL idiom, since
    COUNT() only ever returns a cardinality, never the argument's actual
    value. Blocking this outright made ordinary rate questions fail with
    UNSAFE_SQL in production."""
    database_path = tmp_path / "test.db"
    create_database(database_path)

    result = execute_readonly_query(
        database_path,
        "SELECT COUNT(encounter_id) FROM hospital_readmissions",
        row_limit=10,
        timeout_seconds=1,
    )
    assert result.rows == [(4,)]


def test_permits_identifier_column_inside_count_case_when(tmp_path: Path) -> None:
    """The specific pattern observed in production: conditional counting
    via COUNT(CASE WHEN ... THEN encounter_id END), used to compute a rate
    alongside a total. Still never outputs an actual encounter_id value."""
    database_path = tmp_path / "test.db"
    create_database(database_path)

    result = execute_readonly_query(
        database_path,
        "SELECT COUNT(CASE WHEN readmitted = '>30' THEN encounter_id END) AS readmitted_count, "
        "COUNT(encounter_id) AS total FROM hospital_readmissions",
        row_limit=10,
        timeout_seconds=1,
    )
    assert result.rows == [(2, 4)]


def test_rejects_identifier_column_as_max_argument() -> None:
    """MAX()/MIN() of an identifier WOULD leak its actual value, unlike
    COUNT() — must still be rejected even though MAX is an allowed
    function and the column is now readable at the authorizer layer. This
    is the test that guarantees the balanced-paren COUNT-only check is
    doing real work, not just rubber-stamping any identifier occurrence."""
    with pytest.raises(UnsafeQueryError, match="identifier column"):
        validate_readonly_query(
            "SELECT MAX(encounter_id) FROM hospital_readmissions",
            {"hospital_readmissions"},
        )


def test_rejects_identifier_column_mixed_with_unsafe_use_in_same_query() -> None:
    """A safe COUNT(encounter_id) elsewhere in the select list must not
    whitelist an unsafe bare reference to the same identifier."""
    with pytest.raises(UnsafeQueryError, match="identifier column"):
        validate_readonly_query(
            "SELECT COUNT(encounter_id), encounter_id FROM hospital_readmissions",
            {"hospital_readmissions"},
        )


def test_rejects_identifier_column_selected_alongside_group_by() -> None:
    with pytest.raises(UnsafeQueryError, match="identifier column"):
        validate_readonly_query(
            "SELECT encounter_id, COUNT(*) FROM hospital_readmissions GROUP BY encounter_id",
            {"hospital_readmissions"},
        )


def test_rejects_query_exceeding_column_limit(tmp_path: Path) -> None:
    database_path = tmp_path / "test.db"
    create_database(database_path)

    with pytest.raises(UnsafeQueryError, match="more than"):
        execute_readonly_query(
            database_path,
            "SELECT readmitted, readmitted, readmitted FROM hospital_readmissions",
            row_limit=10,
            timeout_seconds=1,
            column_limit=1,
        )


def test_rejects_query_exceeding_max_length(tmp_path: Path) -> None:
    database_path = tmp_path / "test.db"
    create_database(database_path)

    padding = ", ".join(["'NO'"] * 500)
    with pytest.raises(UnsafeQueryError, match="maximum length"):
        execute_readonly_query(
            database_path,
            f"SELECT readmitted FROM hospital_readmissions WHERE readmitted IN ({padding})",
            row_limit=10,
            timeout_seconds=1,
        )


def test_rejects_sql_comments() -> None:
    with pytest.raises(UnsafeQueryError, match="comments"):
        validate_readonly_query(
            "SELECT readmitted FROM hospital_readmissions -- drop everything",
            {"hospital_readmissions"},
        )


def test_rejects_wildcard_selection() -> None:
    with pytest.raises(UnsafeQueryError, match="Wildcard"):
        validate_readonly_query("SELECT * FROM hospital_readmissions", {"hospital_readmissions"})


def test_rejects_disallowed_function() -> None:
    with pytest.raises(UnsafeQueryError, match="not permitted"):
        validate_readonly_query(
            "SELECT LOAD_EXTENSION('evil') FROM hospital_readmissions",
            {"hospital_readmissions"},
        )


def test_permits_valid_aggregate_with_grouping(tmp_path: Path) -> None:
    database_path = tmp_path / "test.db"
    create_database(database_path)

    result = execute_readonly_query(
        database_path,
        "SELECT readmitted, COUNT(*) FROM hospital_readmissions GROUP BY readmitted",
        row_limit=10,
        timeout_seconds=1,
    )
    assert result.row_count == 3


def test_rejects_common_table_expressions() -> None:
    """CTEs are rejected outright: an attacker could alias a CTE to shadow
    the allowed table name, and validating that safely is out of scope."""
    with pytest.raises(UnsafeQueryError, match="Common table expressions"):
        validate_readonly_query(
            "WITH hospital_readmissions AS (SELECT * FROM secrets) "
            "SELECT readmitted FROM hospital_readmissions",
            {"hospital_readmissions"},
        )


def test_rejects_nested_subquery_referencing_unauthorized_table() -> None:
    with pytest.raises(UnsafeQueryError, match="unapproved table"):
        validate_readonly_query(
            "SELECT readmitted FROM hospital_readmissions "
            "WHERE readmitted IN (SELECT readmitted FROM secrets)",
            {"hospital_readmissions"},
        )


def test_query_timeout_raises_query_timeout_error(tmp_path: Path) -> None:
    database_path = tmp_path / "test.db"
    with sqlite3.connect(database_path) as connection:
        connection.execute(
            "CREATE TABLE hospital_readmissions (encounter_id INTEGER, readmitted TEXT)"
        )
        connection.executemany(
            "INSERT INTO hospital_readmissions VALUES (?, ?)",
            [(i, "NO") for i in range(400)],
        )

    with pytest.raises(QueryTimeoutError):
        execute_readonly_query(
            database_path,
            "SELECT COUNT(*) FROM hospital_readmissions a "
            "JOIN hospital_readmissions b ON a.readmitted = b.readmitted "
            "JOIN hospital_readmissions c ON b.readmitted = c.readmitted",
            row_limit=10,
            timeout_seconds=0,
        )


def test_empty_result_set_is_not_truncated(tmp_path: Path) -> None:
    database_path = tmp_path / "test.db"
    create_database(database_path)

    result = execute_readonly_query(
        database_path,
        "SELECT readmitted FROM hospital_readmissions WHERE readmitted = 'NEVER'",
        row_limit=10,
        timeout_seconds=1,
    )
    assert result.rows == []
    assert result.truncated is False
    assert result.row_count == 0


def test_readonly_connection_cannot_modify_database(tmp_path: Path) -> None:
    database_path = tmp_path / "test.db"
    create_database(database_path)

    with pytest.raises(UnsafeQueryError):
        execute_readonly_query(
            database_path,
            "UPDATE hospital_readmissions SET readmitted = 'NO'",
            row_limit=10,
            timeout_seconds=1,
        )


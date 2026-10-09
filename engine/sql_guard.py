"""Read-only SQL policy enforcement for AI-generated analytics queries.

Defense-in-depth: a textual validator rejects unsafe queries before
execution, and a SQLite authorizer callback denies unauthorized operations
at execution time even if the text validator was bypassed or fooled.
Identifier columns (patient_nbr, encounter_id) are blocked outright rather
than allowed in a narrow "safe aggregate" exception — that exception cannot
be verified reliably from SQL text alone, so this module takes the
conservative position and rejects any reference to them.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re
import sqlite3
import time

MAX_SQL_LENGTH_DEFAULT = 2000
FORBIDDEN_IDENTIFIER_COLUMNS = {"patient_nbr", "encounter_id"}
ALLOWED_TABLE = "hospital_readmissions"

_ALLOWED_FUNCTIONS = {
    "COUNT", "AVG", "SUM", "MIN", "MAX", "ROUND", "CAST", "COALESCE",
    "IFNULL", "LENGTH", "LOWER", "UPPER", "ABS", "DISTINCT",
}


class UnsafeQueryError(ValueError):
    """Raised when generated SQL is outside the read-only analytics policy."""


class QueryTimeoutError(RuntimeError):
    """Raised when query execution is aborted by the progress handler."""


_FORBIDDEN_TOKENS = re.compile(
    r"\b(ATTACH|DETACH|PRAGMA|INSERT|UPDATE|DELETE|REPLACE|DROP|ALTER|CREATE|"
    r"VACUUM|REINDEX|SAVEPOINT|RELEASE|BEGIN|COMMIT|ROLLBACK)\b",
    re.IGNORECASE,
)
_TABLE_REFERENCE = re.compile(r"\b(?:FROM|JOIN)\s+([\w.\"`\[\]-]+)", re.IGNORECASE)
_COMMENT_PATTERN = re.compile(r"--|/\*|\*/")
_FUNCTION_CALL = re.compile(r"\b([A-Za-z_][A-Za-z0-9_]*)\s*\(")
_SQL_KEYWORDS_NOT_FUNCTIONS = {
    "IN", "EXISTS", "NOT", "AND", "OR", "SELECT", "WHERE", "GROUP", "ORDER",
    "HAVING", "AS", "ON", "JOIN", "FROM", "WITH", "BY", "IS", "LIKE",
    "BETWEEN", "CASE", "WHEN", "THEN", "ELSE", "END",
}


def _select_list(query: str) -> str:
    """Best-effort extraction of the top-level SELECT ... FROM column list.

    Not a full SQL parser. Used only to catch bare identifier-column
    selection; the authorizer callback is the authoritative runtime guard.
    """
    match = re.search(r"(?is)^SELECT\s+(.*?)\bFROM\b", query)
    return match.group(1) if match else ""


def validate_readonly_query(
    sql: str,
    allowed_tables: set[str],
    *,
    max_length: int = MAX_SQL_LENGTH_DEFAULT,
) -> str:
    query = sql.strip()
    if not query:
        raise UnsafeQueryError("The model did not return a query")
    if len(query) > max_length:
        raise UnsafeQueryError(f"The query exceeds the maximum length of {max_length} characters")
    if _COMMENT_PATTERN.search(query):
        raise UnsafeQueryError("SQL comments are not permitted")
    if re.match(r"^WITH\b", query, re.IGNORECASE):
        raise UnsafeQueryError("Common table expressions are not permitted")
    if not re.match(r"^SELECT\b", query, re.IGNORECASE):
        raise UnsafeQueryError("Only SELECT statements are allowed")
    if _FORBIDDEN_TOKENS.search(query):
        raise UnsafeQueryError("The query contains a forbidden operation")

    without_trailing_semicolon = query[:-1].strip() if query.endswith(";") else query
    if ";" in without_trailing_semicolon:
        raise UnsafeQueryError("Only one SQL statement is allowed")

    if re.search(r"(?is)^SELECT\s+\*", without_trailing_semicolon):
        raise UnsafeQueryError("Wildcard column selection is not permitted")

    select_list = _select_list(without_trailing_semicolon).lower()
    for identifier in FORBIDDEN_IDENTIFIER_COLUMNS:
        if re.search(rf"\b{identifier}\b", select_list):
            raise UnsafeQueryError(f"The query must not select the identifier column {identifier}")

    for function_name in _FUNCTION_CALL.findall(without_trailing_semicolon):
        upper_name = function_name.upper()
        if upper_name in _SQL_KEYWORDS_NOT_FUNCTIONS:
            continue
        if upper_name not in _ALLOWED_FUNCTIONS:
            raise UnsafeQueryError(f"The function {function_name} is not permitted")

    referenced_tables = {
        match.group(1).strip('"`[]').split(".")[-1].lower()
        for match in _TABLE_REFERENCE.finditer(without_trailing_semicolon)
    }
    if not referenced_tables:
        raise UnsafeQueryError("The query must read from an approved table")
    disallowed = referenced_tables - {table.lower() for table in allowed_tables}
    if disallowed:
        raise UnsafeQueryError(
            f"The query references an unapproved table: {sorted(disallowed)[0]}"
        )
    return f"{without_trailing_semicolon};"


def _authorizer(action: int, arg1: str | None, arg2: str | None, _dbname: str | None, _source: str | None) -> int:
    if action == sqlite3.SQLITE_SELECT:
        return sqlite3.SQLITE_OK
    if action == sqlite3.SQLITE_READ:
        table, column = arg1, arg2
        if table != ALLOWED_TABLE:
            return sqlite3.SQLITE_DENY
        if column and column.lower() in FORBIDDEN_IDENTIFIER_COLUMNS:
            return sqlite3.SQLITE_DENY
        return sqlite3.SQLITE_OK
    if action == sqlite3.SQLITE_FUNCTION:
        function_name = (arg2 or "").upper()
        return sqlite3.SQLITE_OK if function_name in _ALLOWED_FUNCTIONS else sqlite3.SQLITE_DENY
    # Deny everything else by default: PRAGMA, ATTACH, DETACH, DDL, DML,
    # transactions, triggers, views, virtual tables, etc.
    return sqlite3.SQLITE_DENY


@dataclass(frozen=True)
class StructuredQueryResult:
    columns: tuple[str, ...]
    rows: list[tuple]
    row_count: int
    truncated: bool
    duration_ms: float
    source_table: str
    executed_sql: str

    def to_json_safe(self) -> dict:
        return {
            "columns": list(self.columns),
            "rows": [list(row) for row in self.rows],
            "row_count": self.row_count,
            "truncated": self.truncated,
            "duration_ms": round(self.duration_ms, 2),
            "source_table": self.source_table,
        }


def execute_readonly_query(
    database_path: Path,
    sql: str,
    *,
    row_limit: int,
    timeout_seconds: int,
    column_limit: int = 12,
    max_sql_length: int = MAX_SQL_LENGTH_DEFAULT,
) -> StructuredQueryResult:
    validated = validate_readonly_query(sql, {ALLOWED_TABLE}, max_length=max_sql_length)
    uri = f"{database_path.as_uri()}?mode=ro"
    started = time.monotonic()

    connection = sqlite3.connect(uri, uri=True, timeout=timeout_seconds)
    try:
        connection.execute("PRAGMA query_only = ON")
        connection.setlimit(sqlite3.SQLITE_LIMIT_LENGTH, max_sql_length)
        connection.setlimit(sqlite3.SQLITE_LIMIT_COMPOUND_SELECT, 1)
        connection.set_authorizer(_authorizer)

        def abort_slow_query() -> int:
            return int(time.monotonic() - started > timeout_seconds)

        connection.set_progress_handler(abort_slow_query, 1_000)

        try:
            cursor = connection.execute(validated)
        except sqlite3.OperationalError as exc:
            if "interrupted" in str(exc).lower():
                raise QueryTimeoutError("Query execution exceeded the configured timeout") from exc
            raise UnsafeQueryError(f"The query was rejected by the database policy: {exc}") from exc

        column_names = tuple(description[0] for description in cursor.description or ())
        if len(column_names) > column_limit:
            raise UnsafeQueryError(f"The query returns more than {column_limit} columns")

        try:
            rows = cursor.fetchmany(row_limit + 1)
        except sqlite3.OperationalError as exc:
            if "interrupted" in str(exc).lower():
                raise QueryTimeoutError("Query execution exceeded the configured timeout") from exc
            raise
        cursor.close()
    finally:
        connection.close()

    truncated = len(rows) > row_limit
    limited_rows = rows[:row_limit]
    duration_ms = (time.monotonic() - started) * 1000
    return StructuredQueryResult(
        columns=column_names,
        rows=limited_rows,
        row_count=len(limited_rows),
        truncated=truncated,
        duration_ms=duration_ms,
        source_table=ALLOWED_TABLE,
        executed_sql=validated,
    )

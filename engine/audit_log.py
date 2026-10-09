"""Privacy-aware audit logging for the analytics engine.

Writes to a separate SQLite database from the read-only analytics data, so
that generated analytics SQL can never reach audit records (the analytics
executor only ever opens the configured analytics database, never this
one). Raw prompts and full result rows are never stored: only a SHA-256
hash of the prompt, a redacted excerpt, and row counts.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import logging
from pathlib import Path
import sqlite3

LOGGER = logging.getLogger("medorch.engine.audit")

_SCHEMA = """
CREATE TABLE IF NOT EXISTS audit_log (
  audit_id TEXT PRIMARY KEY,
  timestamp_utc TEXT NOT NULL,
  query_id TEXT NOT NULL,
  requester_type TEXT NOT NULL,
  user_subject TEXT,
  selected_context TEXT NOT NULL,
  prompt_sha256 TEXT NOT NULL,
  prompt_redacted_excerpt TEXT,
  executed_sql TEXT,
  execution_status TEXT NOT NULL,
  row_count INTEGER,
  result_truncated BOOLEAN NOT NULL,
  model_version TEXT NOT NULL,
  pii_detected BOOLEAN NOT NULL,
  pii_redacted BOOLEAN NOT NULL,
  error_code TEXT
);
"""

_MAX_EXCERPT_LENGTH = 120


def _redacted_excerpt(prompt: str) -> str:
    try:
        from .pii_guard import inspect_and_redact
    except ImportError:
        from pii_guard import inspect_and_redact
    excerpt = prompt[:_MAX_EXCERPT_LENGTH]
    return inspect_and_redact(excerpt).redacted_text


@dataclass(frozen=True)
class AuditRecord:
    audit_id: str
    query_id: str
    requester_type: str
    selected_context: str
    prompt: str
    executed_sql: str | None
    execution_status: str
    row_count: int | None
    result_truncated: bool
    model_version: str
    pii_detected: bool
    pii_redacted: bool
    error_code: str | None = None
    user_subject: str | None = None


class AuditWriteError(RuntimeError):
    """Raised when an audit record cannot be persisted. Never includes the
    underlying database path or raw exception text in its message, so it
    is always safe to surface a generic notice from this error."""


def initialize_audit_database(database_path: Path) -> None:
    database_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(database_path) as connection:
        connection.execute(_SCHEMA)


def write_audit_record(database_path: Path, record: AuditRecord) -> None:
    prompt_hash = hashlib.sha256(record.prompt.encode("utf-8")).hexdigest()
    try:
        excerpt = _redacted_excerpt(record.prompt)
    except Exception:  # pragma: no cover - defensive; excerpt is best-effort
        excerpt = None

    try:
        with sqlite3.connect(database_path) as connection:
            connection.execute(_SCHEMA)
            connection.execute(
                """
                INSERT INTO audit_log (
                    audit_id, timestamp_utc, query_id, requester_type, user_subject,
                    selected_context, prompt_sha256, prompt_redacted_excerpt, executed_sql,
                    execution_status, row_count, result_truncated, model_version,
                    pii_detected, pii_redacted, error_code
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record.audit_id,
                    datetime.now(timezone.utc).isoformat(),
                    record.query_id,
                    record.requester_type,
                    record.user_subject,
                    record.selected_context,
                    prompt_hash,
                    excerpt,
                    record.executed_sql,
                    record.execution_status,
                    record.row_count,
                    record.result_truncated,
                    record.model_version,
                    record.pii_detected,
                    record.pii_redacted,
                    record.error_code,
                ),
            )
            connection.commit()
    except sqlite3.Error:
        LOGGER.exception("Failed to write audit record %s", record.audit_id)
        raise AuditWriteError("The audit record could not be persisted") from None

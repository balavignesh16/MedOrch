"""Evidence grounding for AI-synthesized answers.

Deterministic formatting is preferred for simple shapes (a single scalar,
or a small grouped table) and needs no model call at all. When narrative
synthesis is used, every numeric token in the summary must be backed by a
NumericClaim that references an actual result cell; claims that don't
match are rejected rather than allowed through as a partial answer.

Grounding is never done by searching for numbers in repr(rows) — that
breaks on formatting, percentages, rounding, and derived values. Instead
each claim explicitly names its row/column, and the claim's rendered value
is compared against that cell after normalizing formatting.
"""

from __future__ import annotations

from dataclasses import dataclass
import re

from pydantic import BaseModel

try:
    from .sql_guard import FORBIDDEN_IDENTIFIER_COLUMNS, StructuredQueryResult
except ImportError:
    from sql_guard import FORBIDDEN_IDENTIFIER_COLUMNS, StructuredQueryResult

_NUMERIC_TOKEN = re.compile(r"-?\d[\d,]*(?:\.\d+)?%?")


class EvidenceReference(BaseModel):
    row_index: int
    column_name: str


class NumericClaim(BaseModel):
    rendered_value: str
    evidence: EvidenceReference


class GroundedAnswer(BaseModel):
    summary_text: str
    numeric_claims: list[NumericClaim]


class GroundingError(ValueError):
    """Raised when a synthesized answer cannot be verified against query results."""


def _normalize(value: str) -> str:
    return value.strip().replace(",", "").rstrip("%")


def _cell_matches(rendered_value: str, cell_value: object) -> bool:
    normalized_claim = _normalize(rendered_value)
    normalized_cell = _normalize(str(cell_value))
    if normalized_claim == normalized_cell:
        return True
    try:
        return abs(float(normalized_claim) - float(normalized_cell)) < 1e-6
    except (TypeError, ValueError):
        return False


def validate_grounded_answer(answer: GroundedAnswer, result: StructuredQueryResult) -> str:
    """Return the validated summary text, or raise GroundingError."""
    for claim in answer.numeric_claims:
        if claim.evidence.column_name in FORBIDDEN_IDENTIFIER_COLUMNS:
            raise GroundingError("A claim cannot cite an identifier column")
        if not (0 <= claim.evidence.row_index < len(result.rows)):
            raise GroundingError("A claim references a row that does not exist")
        if claim.evidence.column_name not in result.columns:
            raise GroundingError("A claim references a column that does not exist")
        column_index = result.columns.index(claim.evidence.column_name)
        cell_value = result.rows[claim.evidence.row_index][column_index]
        if not _cell_matches(claim.rendered_value, cell_value):
            raise GroundingError("A claim's value does not match the referenced result cell")

    claimed_values = {_normalize(claim.rendered_value) for claim in answer.numeric_claims}
    for token in _NUMERIC_TOKEN.findall(answer.summary_text):
        if _normalize(token) not in claimed_values:
            raise GroundingError("The summary contains a number with no supporting evidence claim")

    return answer.summary_text


@dataclass(frozen=True)
class DeterministicSummary:
    text: str


def render_deterministic_summary(result: StructuredQueryResult, prompt: str) -> DeterministicSummary | None:
    """Render a terse, safe caption for any result shape, with no model call.

    Always returns a value (the return type stays Optional for callers that
    want to treat this purely as a fallback path). The caller decides when
    to prefer this over narrative synthesis — see ProcessQuery's
    `is_trivial` check, which uses this directly only for empty/single-value
    results and otherwise keeps it in reserve as what a synthesis failure
    falls back to.

    Any tabular result (rows with one or more columns) is handled
    deterministically: the caller separately attaches the full structured
    result as a table via visualization_data_json, so the text here only
    needs to be a short, safe caption — not a per-row narrative — which
    avoids asking a model to cite evidence for every cell of a large table,
    a task that is both slow and unreliable for small local models. Free-form
    narrative synthesis is reserved for shapes not handled here (currently
    none in this schema-driven assistant, but the machinery stays available
    for future question types that genuinely need prose).
    """
    if result.row_count == 0:
        return DeterministicSummary(
            "No matching encounters were found in the historical hospital_readmissions data for this request."
        )

    if len(result.columns) == 1 and result.row_count == 1:
        value = result.rows[0][0]
        return DeterministicSummary(
            f"{result.columns[0]}: {value} (from {result.row_count} row of historical encounter data)."
        )

    if result.row_count == 1:
        pairs = ", ".join(f"{col}: {val}" for col, val in zip(result.columns, result.rows[0]))
        return DeterministicSummary(f"{pairs} (from 1 row of historical encounter data).")

    preview_limit = 20
    lines = [
        ", ".join(f"{col}={val}" for col, val in zip(result.columns, row))
        for row in result.rows[:preview_limit]
    ]
    caption = (
        f"{result.row_count} grouped result(s) from historical encounter data "
        f"(columns: {', '.join(result.columns)}). See the table below for full results."
    )
    if result.row_count > preview_limit:
        caption += f" First {preview_limit} shown here:\n" + "\n".join(lines)
    else:
        caption += "\n" + "\n".join(lines)
    return DeterministicSummary(caption)

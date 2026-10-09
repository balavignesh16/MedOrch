"""Outbound identifier protection.

This is limited direct-identifier pattern protection, not comprehensive
clinical NER, HIPAA certification, or formal de-identification validation.
It inspects every outbound text field (summary, visualization JSON,
citations, error messages, provenance) for the two identifier columns the
SQL policy already blocks from query results, plus identifier-shaped
numeric sequences explicitly labelled as such in text.

Semantics:
- pii_detected=True when a prohibited identifier pattern is found anywhere
  in the outbound payload.
- pii_redacted=True only when every detected occurrence was safely removed.
- Legacy pii_scrubbed=True only when the complete outbound payload has been
  inspected and contains no remaining detected identifiers (i.e. either
  nothing was found, or everything found was redacted).
"""

from __future__ import annotations

from dataclasses import dataclass
import re

_IDENTIFIER_PATTERNS = [
    re.compile(r"\bpatient_nbr\D{0,10}\d+", re.IGNORECASE),
    re.compile(r"\bencounter_id\D{0,10}\d+", re.IGNORECASE),
    re.compile(r"\bpatient(?:\s+id)?\s*[:#]?\s*\d{5,}\b", re.IGNORECASE),
]


@dataclass(frozen=True)
class InspectionResult:
    detected: bool
    redacted_text: str
    fully_redacted: bool


def inspect_and_redact(text: str) -> InspectionResult:
    if not text:
        return InspectionResult(detected=False, redacted_text=text, fully_redacted=True)

    detected = False
    redacted = text
    for pattern in _IDENTIFIER_PATTERNS:
        if pattern.search(redacted):
            detected = True
            redacted = pattern.sub("[REDACTED]", redacted)

    fully_redacted = not any(pattern.search(redacted) for pattern in _IDENTIFIER_PATTERNS)
    return InspectionResult(detected=detected, redacted_text=redacted, fully_redacted=fully_redacted)


@dataclass(frozen=True)
class PayloadInspection:
    pii_detected: bool
    pii_redacted: bool
    pii_scrubbed: bool
    summary_text: str
    visualization_data_json: str


def inspect_outbound_payload(summary_text: str, visualization_data_json: str) -> PayloadInspection:
    """Inspect and redact every outbound text field before it leaves the engine."""
    summary_result = inspect_and_redact(summary_text)
    visualization_result = inspect_and_redact(visualization_data_json)

    detected = summary_result.detected or visualization_result.detected
    fully_redacted = summary_result.fully_redacted and visualization_result.fully_redacted

    return PayloadInspection(
        pii_detected=detected,
        pii_redacted=detected and fully_redacted,
        pii_scrubbed=fully_redacted,
        summary_text=summary_result.redacted_text,
        visualization_data_json=visualization_result.redacted_text,
    )

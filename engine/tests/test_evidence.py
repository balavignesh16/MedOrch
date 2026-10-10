import pytest

from engine.evidence import (
    EvidenceReference,
    GroundedAnswer,
    GroundingError,
    NumericClaim,
    render_deterministic_summary,
    validate_grounded_answer,
)
from engine.sql_guard import StructuredQueryResult


def _result(columns, rows) -> StructuredQueryResult:
    return StructuredQueryResult(
        columns=tuple(columns),
        rows=rows,
        row_count=len(rows),
        truncated=False,
        duration_ms=1.0,
        source_table="hospital_readmissions",
        executed_sql="SELECT 1;",
    )


def test_deterministic_summary_for_empty_result() -> None:
    result = _result(["readmitted"], [])
    summary = render_deterministic_summary(result, "count")
    assert summary is not None
    assert "No matching encounters" in summary.text


def test_deterministic_summary_for_single_scalar() -> None:
    result = _result(["count"], [(42,)])
    summary = render_deterministic_summary(result, "count encounters")
    assert "42" in summary.text


def test_deterministic_summary_for_grouped_table() -> None:
    result = _result(["readmitted", "count"], [("NO", 10), ("<30", 5)])
    summary = render_deterministic_summary(result, "group by readmitted")
    assert "readmitted=NO, count=10" in summary.text
    assert "readmitted=<30, count=5" in summary.text


def test_deterministic_summary_handles_wide_single_row_tables() -> None:
    result = _result(["a", "b", "c"], [(1, 2, 3)])
    summary = render_deterministic_summary(result, "anything")
    assert summary is not None
    assert "a: 1" in summary.text and "b: 2" in summary.text and "c: 3" in summary.text


def test_deterministic_summary_handles_large_grouped_tables_without_a_model_call() -> None:
    """Any tabular result is rendered deterministically now — large grouped
    results (e.g. GROUP BY diag_1 with 400+ distinct codes) no longer fall
    back to LLM narrative synthesis, which was unreliable for small local
    models and caused legitimate multi-row questions to fail with
    INVALID_MODEL_OUTPUT."""
    rows = [(f"code{i}", i) for i in range(50)]
    result = _result(["diag_1", "count"], rows)
    summary = render_deterministic_summary(result, "group by diag_1")
    assert summary is not None
    assert "50 grouped result(s)" in summary.text
    assert "First 20 shown here" in summary.text


def test_valid_grounded_answer_passes() -> None:
    result = _result(["readmitted", "count"], [("NO", 10), ("<30", 5)])
    answer = GroundedAnswer(
        summary_text="10 encounters were not readmitted; 5 were readmitted early.",
        numeric_claims=[
            NumericClaim(rendered_value="10", evidence=EvidenceReference(row_index=0, column_name="count")),
            NumericClaim(rendered_value="5", evidence=EvidenceReference(row_index=1, column_name="count")),
        ],
    )
    assert "10 encounters" in validate_grounded_answer(answer, result)


def test_fabricated_number_without_claim_is_rejected() -> None:
    result = _result(["count"], [(42,)])
    answer = GroundedAnswer(
        summary_text="There were 42 encounters, a 15% increase.",
        numeric_claims=[
            NumericClaim(rendered_value="42", evidence=EvidenceReference(row_index=0, column_name="count")),
        ],
    )
    with pytest.raises(GroundingError, match="no supporting evidence"):
        validate_grounded_answer(answer, result)


def test_claim_referencing_missing_row_is_rejected() -> None:
    result = _result(["count"], [(42,)])
    answer = GroundedAnswer(
        summary_text="42",
        numeric_claims=[
            NumericClaim(rendered_value="42", evidence=EvidenceReference(row_index=5, column_name="count")),
        ],
    )
    with pytest.raises(GroundingError, match="row that does not exist"):
        validate_grounded_answer(answer, result)


def test_claim_referencing_missing_column_is_rejected() -> None:
    result = _result(["count"], [(42,)])
    answer = GroundedAnswer(
        summary_text="42",
        numeric_claims=[
            NumericClaim(rendered_value="42", evidence=EvidenceReference(row_index=0, column_name="other")),
        ],
    )
    with pytest.raises(GroundingError, match="column that does not exist"):
        validate_grounded_answer(answer, result)


def test_claim_with_mismatched_value_is_rejected() -> None:
    result = _result(["count"], [(42,)])
    answer = GroundedAnswer(
        summary_text="99",
        numeric_claims=[
            NumericClaim(rendered_value="99", evidence=EvidenceReference(row_index=0, column_name="count")),
        ],
    )
    with pytest.raises(GroundingError, match="does not match"):
        validate_grounded_answer(answer, result)


def test_claim_citing_identifier_column_is_rejected() -> None:
    result = _result(["encounter_id"], [(1,)])
    answer = GroundedAnswer(
        summary_text="1",
        numeric_claims=[
            NumericClaim(rendered_value="1", evidence=EvidenceReference(row_index=0, column_name="encounter_id")),
        ],
    )
    with pytest.raises(GroundingError, match="identifier column"):
        validate_grounded_answer(answer, result)


def test_percentage_and_decimal_formatting_normalizes() -> None:
    result = _result(["rate"], [(15.2,)])
    answer = GroundedAnswer(
        summary_text="The rate was 15.2%.",
        numeric_claims=[
            NumericClaim(rendered_value="15.2%", evidence=EvidenceReference(row_index=0, column_name="rate")),
        ],
    )
    assert "15.2%" in validate_grounded_answer(answer, result)


def test_thousands_separator_normalizes() -> None:
    result = _result(["count"], [(1234,)])
    answer = GroundedAnswer(
        summary_text="There were 1,234 encounters.",
        numeric_claims=[
            NumericClaim(rendered_value="1,234", evidence=EvidenceReference(row_index=0, column_name="count")),
        ],
    )
    assert "1,234" in validate_grounded_answer(answer, result)


def _single_claim(rendered: str, value: object, column: str = "rate") -> tuple[GroundedAnswer, object]:
    result = _result([column], [(value,)])
    answer = GroundedAnswer(
        summary_text=rendered,
        numeric_claims=[NumericClaim(rendered_value=rendered, evidence=EvidenceReference(row_index=0, column_name=column))],
    )
    return answer, result


@pytest.mark.parametrize(
    ("rendered", "cell"),
    [
        ("10.0%", 10.037355169575586),
        ("13.9%", 13.897528237027337),
        ("10", 10.037355169575586),
        ("0.11", 0.11128399623974845),
        ("0.1", 0.11128399623974845 - 0.0113),
        ("12.5", 12.45),
        ("1,234", 1234.4),
    ],
)
def test_claim_rounded_to_its_own_precision_is_accepted(rendered: str, cell: float) -> None:
    answer, result = _single_claim(rendered, cell)
    assert validate_grounded_answer(answer, result) == rendered


@pytest.mark.parametrize(
    ("rendered", "cell"),
    [
        ("10.1%", 10.037355169575586),
        ("10.03", 10.037755169575586),
        ("11", 10.037355169575586),
        ("0.2", 0.11128399623974845),
        ("5", 4.4),
    ],
)
def test_claim_that_is_not_a_correct_rounding_is_still_rejected(rendered: str, cell: float) -> None:
    answer, result = _single_claim(rendered, cell)
    with pytest.raises(GroundingError, match="does not match"):
        validate_grounded_answer(answer, result)


def test_rounding_never_legitimizes_non_numeric_or_missing_cells() -> None:
    for cell in (None, "NO", float("nan"), float("inf")):
        answer, result = _single_claim("1", cell)
        with pytest.raises(GroundingError):
            validate_grounded_answer(answer, result)


def test_numbers_from_the_users_own_question_do_not_need_a_data_claim() -> None:
    result = _result(["insulin", "rate"], [("No", 10.0), ("Up", 13.0)])
    answer = GroundedAnswer(
        summary_text="The 30-day readmission rate was 13.0% for Up and 10.0% for No.",
        numeric_claims=[
            NumericClaim(rendered_value="13.0%", evidence=EvidenceReference(row_index=1, column_name="rate")),
            NumericClaim(rendered_value="10.0", evidence=EvidenceReference(row_index=0, column_name="rate")),
        ],
    )
    assert validate_grounded_answer(answer, result, "Compare the 30-day readmission rate by insulin") == answer.summary_text
    with pytest.raises(GroundingError, match="no supporting evidence"):
        validate_grounded_answer(answer, result, "Compare readmission rates by insulin")


def test_numbers_inside_result_labels_do_not_need_a_data_claim() -> None:
    result = _result(["age", "rate"], [("[80-90)", 12.8), ("[90-100)", 12.0)])
    answer = GroundedAnswer(
        summary_text="Ages 80-90 had a rate of 12.8, higher than 90-100 at 12.0.",
        numeric_claims=[
            NumericClaim(rendered_value="12.8", evidence=EvidenceReference(row_index=0, column_name="rate")),
            NumericClaim(rendered_value="12.0", evidence=EvidenceReference(row_index=1, column_name="rate")),
        ],
    )
    assert validate_grounded_answer(answer, result) == answer.summary_text


def test_a_fabricated_number_is_still_rejected_even_with_free_tokens_present() -> None:
    result = _result(["age", "rate"], [("[80-90)", 12.8)])
    answer = GroundedAnswer(
        summary_text="Ages 80-90 had a rate of 12.8, about 47 more than baseline.",
        numeric_claims=[NumericClaim(rendered_value="12.8", evidence=EvidenceReference(row_index=0, column_name="rate"))],
    )
    with pytest.raises(GroundingError, match="no supporting evidence"):
        validate_grounded_answer(answer, result, "Compare the 30-day rate by age")

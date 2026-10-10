from engine.pii_guard import inspect_and_redact, inspect_outbound_payload


def test_clean_text_is_not_detected() -> None:
    result = inspect_and_redact("10 encounters were readmitted within 30 days.")
    assert result.detected is False
    assert result.fully_redacted is True


def test_patient_nbr_pattern_is_detected_and_redacted() -> None:
    result = inspect_and_redact("patient_nbr 88234 was readmitted.")
    assert result.detected is True
    assert "88234" not in result.redacted_text
    assert result.fully_redacted is True


def test_encounter_id_pattern_is_detected_and_redacted() -> None:
    result = inspect_and_redact("encounter_id: 55555 flagged.")
    assert result.detected is True
    assert "55555" not in result.redacted_text


def test_encounter_id_inside_a_count_expression_is_not_a_false_positive() -> None:
    # "COUNT(encounter_id)" is the column name of an aggregate, not a leaked
    # row-level identifier value — the digit that follows is an unrelated
    # row count, and must not be mistaken for the identifier's value.
    result = inspect_and_redact("COUNT(encounter_id) (from 1 row of historical encounter data).")
    assert result.detected is False
    assert result.redacted_text == "COUNT(encounter_id) (from 1 row of historical encounter data)."


def test_inspect_outbound_payload_covers_summary_and_visualization() -> None:
    payload = inspect_outbound_payload(
        "Clean summary text.", '{"patient_nbr": 12345}'
    )
    assert payload.pii_detected is True
    assert payload.pii_redacted is True
    assert payload.pii_scrubbed is True
    assert "12345" not in payload.visualization_data_json


def test_inspect_outbound_payload_clean_sets_scrubbed_true() -> None:
    payload = inspect_outbound_payload("10 encounters.", '{"count": 10}')
    assert payload.pii_detected is False
    assert payload.pii_redacted is False
    assert payload.pii_scrubbed is True

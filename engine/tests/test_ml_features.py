from __future__ import annotations

import pytest

pd = pytest.importorskip("pandas")

from engine.ml.features import (  # noqa: E402
    MEDICATION_COLUMNS,
    add_engineered_features,
    age_band,
    age_midpoint,
    exclusion_counts,
    icd9_group,
)


@pytest.mark.parametrize(
    ("code", "expected"),
    [
        ("250", "Diabetes"),
        ("250.83", "Diabetes"),
        ("250.01", "Diabetes"),
        ("390", "Circulatory"),
        ("414", "Circulatory"),
        ("459", "Circulatory"),
        ("785", "Circulatory"),
        ("460", "Respiratory"),
        ("519", "Respiratory"),
        ("786", "Respiratory"),
        ("520", "Digestive"),
        ("579", "Digestive"),
        ("787", "Digestive"),
        ("800", "Injury"),
        ("999", "Injury"),
        ("710", "Musculoskeletal"),
        ("739", "Musculoskeletal"),
        ("580", "Genitourinary"),
        ("629", "Genitourinary"),
        ("788", "Genitourinary"),
        ("140", "Neoplasms"),
        ("239", "Neoplasms"),
        ("V57", "Other"),
        ("E909", "Other"),
        ("e909", "Other"),
        ("240", "Other"),
        ("389", "Other"),
        ("100", "Other"),
        ("abc", "Other"),
        ("?", "Missing"),
        ("", "Missing"),
        ("None", "Missing"),
        ("nan", "Missing"),
        (None, "Missing"),
    ],
)
def test_icd9_group(code: object, expected: str) -> None:
    assert icd9_group(code) == expected


def test_age_midpoint_and_band() -> None:
    assert age_midpoint("[70-80)") == 75.0
    assert age_midpoint("[0-10)") == 5.0
    assert age_midpoint(None) is None
    assert age_midpoint("garbage") is None
    assert age_band("[20-30)") == "<40"
    assert age_band("[40-50)") == "40-59"
    assert age_band("[60-70)") == "60-79"
    assert age_band("[90-100)") == "80+"
    assert age_band(None) == "Unknown"


def _frame() -> pd.DataFrame:
    base = {
        "patient_nbr": [1, 2, 3],
        "age": ["[70-80)", "[40-50)", None],
        "diag_1": ["250.83", "414", "V57"],
        "diag_2": ["?", "786", None],
        "diag_3": ["None", "520", "E909"],
        "number_outpatient": [1, 0, 2],
        "number_emergency": [0, 1, 2],
        "number_inpatient": [2, 0, 1],
        "a1cresult": [None, ">8", "Norm"],
        "readmitted": ["<30", ">30", "NO"],
        "discharge_disposition_id": [1, 11, 13],
    }
    for column in MEDICATION_COLUMNS:
        base[column] = ["No", "No", "No"]
    base["insulin"] = ["Up", "Steady", "No"]
    base["metformin"] = ["Down", "Steady", "No"]
    return pd.DataFrame(base)


def test_engineered_features_on_hand_built_rows() -> None:
    result = add_engineered_features(_frame())
    assert result["total_prior_visits"].tolist() == [3, 1, 5]
    assert result["num_med_changes"].tolist() == [2, 0, 0]
    assert result["num_meds_active"].tolist() == [2, 2, 0]
    assert result["insulin_changed"].tolist() == [1, 0, 0]
    assert result["a1c_tested"].tolist() == [0, 1, 1]
    assert result["age_midpoint"].tolist()[:2] == [75.0, 45.0]
    assert result["diag_1_group"].tolist() == ["Diabetes", "Circulatory", "Other"]
    assert result["diag_2_group"].tolist() == ["Missing", "Respiratory", "Missing"]
    assert result["target"].tolist() == [1, 0, 0]


def test_death_and_hospice_encounters_are_out_of_scope() -> None:
    result = add_engineered_features(_frame())
    assert result["in_scope"].tolist() == [1, 0, 0]
    assert exclusion_counts(result) == {"expired": 1, "hospice": 1}

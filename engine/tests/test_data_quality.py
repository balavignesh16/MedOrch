from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest

pd = pytest.importorskip("pandas")

from engine.analysis import data_quality as quality  # noqa: E402
from engine.ml.features import MEDICATION_COLUMNS  # noqa: E402


def _raw_frame() -> pd.DataFrame:
    rows = [
        # encounter, patient, race, weight, payer, specialty, discharge, a1c, glu, readmitted
        (1, 10, "Caucasian", "?", "?", "?", 1, "None", "None", "NO"),
        (2, 10, "?", "?", "MC", "Cardiology", 1, ">8", "Norm", "<30"),
        (3, 11, "Asian", "?", "?", "?", 11, "Norm", "None", ">30"),
        (4, 12, "Caucasian", "[75-100)", "MC", "?", 13, "None", "None", "NO"),
        (5, 12, "Caucasian", "?", "MC", "?", 1, "None", "None", "NO"),
        (6, 12, "Hispanic", "?", "?", "?", 1, ">7", "None", "<30"),
    ]
    frame = pd.DataFrame(
        rows,
        columns=["encounter_id", "patient_nbr", "race", "weight", "payer_code", "medical_specialty",
                 "discharge_disposition_id", "A1Cresult", "max_glu_serum", "readmitted"],
    )
    for index, drug in enumerate(MEDICATION_COLUMNS):
        frame[drug.replace("glyburide_metformin", "glyburide-metformin")] = ["No", "Steady", "Up", "Down", "No", "Steady"][: len(frame)]
    return frame


def _write_fixture(tmp_path: Path) -> tuple[Path, Path]:
    csv_path = tmp_path / "diabetic_data.csv"
    _raw_frame().to_csv(csv_path, index=False)
    db_path = tmp_path / "medorch.db"
    with sqlite3.connect(db_path) as connection:
        connection.execute("CREATE TABLE hospital_readmissions (encounter_id INTEGER, patient_nbr INTEGER, race TEXT, "
                           "discharge_disposition_id INTEGER, a1cresult TEXT, max_glu_serum TEXT, readmitted TEXT, "
                           "predicted_readmission_risk REAL)")
        connection.executemany("INSERT INTO hospital_readmissions VALUES (?, ?, ?, ?, ?, ?, ?, NULL)",
                               [(1, 10, "Caucasian", 1, None, None, "NO"), (2, 10, None, 1, ">8", "Norm", "<30"),
                                (3, 11, "Asian", 11, "Norm", None, ">30"), (4, 12, "Caucasian", 13, None, None, "NO"),
                                (5, 12, "Caucasian", 1, None, None, "NO"), (6, 12, "Hispanic", 1, ">7", None, "<30")])
    return csv_path, db_path


def test_missingness_counts_question_marks_and_separates_not_performed_tests() -> None:
    table = {row["column"]: row for row in quality.missingness_table(_raw_frame().astype(str))}
    assert table["weight"]["missing"] == 5
    assert table["weight"]["missing_percent"] == pytest.approx(83.33)
    assert table["race"]["missing"] == 1
    assert table["A1Cresult"]["missing"] == 0
    assert table["A1Cresult"]["not_performed"] == 3
    assert table["max_glu_serum"]["not_performed"] == 5
    ordered = [row["missing_percent"] for row in quality.missingness_table(_raw_frame().astype(str))]
    assert ordered == sorted(ordered, reverse=True)


def test_repeat_patient_profile() -> None:
    profile = quality.repeat_patient_profile(_raw_frame())
    assert profile["patients"] == 3
    assert profile["distribution"] == {"1": 1, "2": 1, "3": 1, "4": 0, "5+": 0}
    assert profile["patients_with_multiple_encounters"] == 2
    assert profile["encounters_from_repeat_patients"] == 5
    assert profile["max_encounters_for_one_patient"] == 3
    assert "splits by patient" in profile["why_it_matters"]


def test_outcome_balance_and_exclusions() -> None:
    balance = quality.outcome_balance(_raw_frame())
    assert balance["classes"]["NO"]["count"] == 3
    assert balance["classes"]["<30"]["count"] == 2
    assert balance["classes"][">30"]["count"] == 1
    assert sum(c["percent"] for c in balance["classes"].values()) == pytest.approx(100, abs=0.05)

    exclusions = quality.exclusion_profile(_raw_frame(), {"discharge_disposition_id": {11: "Expired", 13: "Hospice / home"}})
    by_code = {row["code"]: row for row in exclusions["codes"]}
    assert by_code[11]["count"] == 1 and by_code[11]["description"] == "Expired"
    assert by_code[13]["count"] == 1 and by_code[13]["reason"] == "hospice"
    assert exclusions["total_excluded"] == 2


def test_build_profile_cross_checks_the_database(tmp_path: Path) -> None:
    csv_path, db_path = _write_fixture(tmp_path)
    profile = quality.build_profile(csv_path, db_path)
    consistency = profile["database_consistency"]
    assert consistency["rows_match"] is True
    assert consistency["duplicate_encounter_ids_in_raw"] == 0
    assert consistency["database_columns_added_by_scoring"] == ["predicted_readmission_risk"]
    assert {"weight", "payer_code", "medical_specialty"} <= set(consistency["source_columns_not_in_database"])

    by_column = {row["column"]: row for row in profile["missingness"]}
    assert by_column["weight"]["in_database"] is False
    assert "too sparse" in by_column["weight"]["exclusion_reason"]
    assert by_column["race"]["in_database"] is True
    assert {entry["drug"] for entry in profile["medication_prevalence"]} == set(MEDICATION_COLUMNS)
    assert {d["term"] for d in profile["definitions"]} >= {"Readmission (assistant, dashboards)", "30-day readmission (model, research)"}
    assert [node["id"] for node in profile["lineage"]][0] == "uci"


def test_database_row_mismatch_is_detected(tmp_path: Path) -> None:
    csv_path, db_path = _write_fixture(tmp_path)
    with sqlite3.connect(db_path) as connection:
        connection.execute("DELETE FROM hospital_readmissions WHERE encounter_id = 6")
    profile = quality.build_profile(csv_path, db_path)
    assert profile["database_consistency"]["rows_match"] is False

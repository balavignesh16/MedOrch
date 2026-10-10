from __future__ import annotations

import json
from pathlib import Path

import pytest

np = pytest.importorskip("numpy")
pd = pytest.importorskip("pandas")
pytest.importorskip("statsmodels")
pytest.importorskip("scipy")

from engine.analysis import hba1c_study as study  # noqa: E402
from engine.ml.features import MEDICATION_COLUMNS, add_engineered_features  # noqa: E402


@pytest.mark.parametrize(
    ("a1c", "change", "expected"),
    [
        (None, "Ch", "not_measured"),
        (None, "No", "not_measured"),
        (float("nan"), "No", "not_measured"),
        ("Norm", "Ch", "normal"),
        ("Norm", "No", "normal"),
        (">7", "Ch", "normal"),
        (">7", "No", "normal"),
        (">8", "Ch", "high_changed"),
        (">8", "No", "high_no_change"),
        (">8", None, None),
        ("weird", "No", None),
    ],
)
def test_exposure_group_assignment_covers_every_coding(a1c, change, expected) -> None:
    assert study.assign_exposure_group(a1c, change) == expected


def test_grouping_helpers() -> None:
    assert study.collapse_diagnosis_group("Circulatory") == "Circulatory"
    assert study.collapse_diagnosis_group("Neoplasms") == "Other"
    assert study.discharge_group(1) == "home"
    assert study.discharge_group(22) == "facility"
    assert study.discharge_group(None) == "other"
    assert study.admission_source_group(7) == "emergency"
    assert study.admission_source_group(1) == "referral"
    assert study.admission_source_group(None) == "other"


def _raw_frame() -> pd.DataFrame:
    rows = []
    # patient 1 has two encounters (lowest encounter_id must be kept); patient 4 died; patient 5 invalid gender;
    # patient 6 has an uncodable exposure (>8 with no change value).
    spec = [
        (10, 1, "Male", 1, None, "No", "NO"),
        (5, 1, "Male", 1, ">8", "Ch", "<30"),
        (20, 2, "Female", 1, "Norm", "No", ">30"),
        (30, 3, "Female", 6, ">8", "No", "NO"),
        (40, 4, "Male", 11, None, "No", "NO"),
        (50, 5, "Unknown/Invalid", 1, None, "No", "NO"),
        (60, 6, "Male", 1, ">8", None, "NO"),
    ]
    for encounter_id, patient, gender, discharge, a1c, change, readmitted in spec:
        row = {
            "encounter_id": encounter_id, "patient_nbr": patient, "race": None, "gender": gender, "age": "[60-70)",
            "admission_source_id": 7, "discharge_disposition_id": discharge, "time_in_hospital": 3,
            "number_outpatient": 0, "number_emergency": 0, "number_inpatient": 0,
            "diag_1": "414", "diag_2": "250", "diag_3": "?", "a1cresult": a1c, "change": change,
            "readmitted": readmitted,
        }
        for column in MEDICATION_COLUMNS:
            row[column] = "No"
        rows.append(row)
    return add_engineered_features(pd.DataFrame(rows))


def test_cohort_flow_applies_each_documented_step_in_order() -> None:
    cohort, flow = study.build_cohort(_raw_frame())
    counts = {step["step"]: step["encounters"] for step in flow}
    assert counts == {
        "all_encounters": 7,
        "exclude_death_hospice": 6,
        "first_encounter_per_patient": 5,
        "valid_gender": 4,
        "assignable_exposure": 3,
    }
    assert cohort["patient_nbr"].is_unique
    kept = cohort[cohort["patient_nbr"] == 1].iloc[0]
    assert kept["encounter_id"] == 5 and kept["exposure"] == "high_changed"
    assert set(cohort["race"]) == {"Unknown"}


def test_group_rate_table_uses_wilson_intervals() -> None:
    cohort = pd.DataFrame({"exposure": ["normal"] * 20, "target": [1] * 10 + [0] * 10})
    rows = study.group_rate_table(cohort)
    assert rows[0]["rate"] == 0.5 and rows[0]["n"] == 20
    assert rows[0]["rate_ci95"] == pytest.approx([0.2993, 0.7007], abs=5e-4)
    assert rows[0]["label"] == study.EXPOSURE_LABELS["normal"]


def test_chi_square_matches_scipy_on_a_known_table() -> None:
    from scipy.stats import chi2_contingency

    counts = {"not_measured": (30, 70), "normal": (20, 80), "high_changed": (25, 75), "high_no_change": (15, 85)}
    rows = []
    for group, (events, nonevents) in counts.items():
        rows += [{"exposure": group, "target": 1}] * events + [{"exposure": group, "target": 0}] * nonevents
    result = study.chi_square_test(pd.DataFrame(rows))
    expected = chi2_contingency(np.array(list(counts.values())))
    assert result["chi2"] == pytest.approx(expected[0], abs=1e-3)
    assert result["p_value"] == pytest.approx(expected[1])
    assert result["dof"] == 3 and result["n"] == 400


def _synthetic_cohort(effect: float, interaction_only_in: str | None, seed: int, n: int = 8000) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    exposure = rng.choice(study.EXPOSURE_ORDER, size=n, p=[0.5, 0.2, 0.15, 0.15])
    diag = rng.choice(["Circulatory", "Diabetes", "Respiratory", "Digestive", "Other"], size=n)
    logit = np.full(n, -2.2)
    hit = exposure == "high_changed"
    if interaction_only_in is not None:
        hit = hit & (diag == interaction_only_in)
    logit = logit + effect * hit
    target = (rng.uniform(size=n) < 1 / (1 + np.exp(-logit))).astype(int)
    return pd.DataFrame(
        {
            "target": target, "exposure": exposure, "diag_group": diag,
            "age_band": rng.choice(["<40", "40-59", "60-79", "80+"], size=n),
            "race": rng.choice(["Caucasian", "AfricanAmerican", "Unknown"], size=n),
            "gender": rng.choice(["Male", "Female"], size=n),
            "admission_group": rng.choice(["emergency", "referral", "transfer"], size=n),
            "discharge_group": rng.choice(["home", "facility", "other"], size=n),
            "time_in_hospital": rng.integers(1, 14, size=n),
        }
    )


def test_adjusted_model_recovers_a_planted_effect() -> None:
    cohort = _synthetic_cohort(effect=0.8, interaction_only_in=None, seed=1)
    result = study.fit_adjusted_model(cohort)
    rows = {r["term"]: r for r in result["exposure_odds_ratios"]}
    planted = rows["high_changed"]
    assert planted["odds_ratio"] > 1.5
    assert planted["ci95"][0] > 1.0
    assert planted["p_value"] < 0.001
    assert rows["normal"]["ci95"][0] < 1.0 < rows["normal"]["ci95"][1]
    assert result["reference_group"] == "not_measured"
    assert all(r["ci95"][0] <= r["odds_ratio"] <= r["ci95"][1] for r in result["exposure_odds_ratios"])


def test_interaction_test_detects_a_planted_interaction_and_not_a_null() -> None:
    planted = study.interaction_lr_test(_synthetic_cohort(effect=1.2, interaction_only_in="Circulatory", seed=2, n=20000))
    assert planted["significant_at_0.05"] is True and planted["p_value"] < 0.001

    null = study.interaction_lr_test(_synthetic_cohort(effect=0.0, interaction_only_in=None, seed=3, n=6000))
    assert null["significant_at_0.05"] is False


def test_paper_comparison_is_honest_about_non_significance() -> None:
    def adjusted(rows):
        return {"exposure_odds_ratios": [{"term": t, "odds_ratio": o, "p_value": p} for t, o, p in rows]}

    weak = study.paper_comparison(adjusted([("a", 0.9, 0.4), ("b", 0.8, 0.2), ("c", 0.95, 0.6)]))
    assert weak["same_direction_as_paper"] is True
    assert "no individual group reaches p < 0.05" in weak["assessment"]
    assert weak["verify_against_paper"] is True

    strong = study.paper_comparison(adjusted([("a", 0.9, 0.01), ("b", 0.8, 0.2), ("c", 0.95, 0.6)]))
    assert "individually significant" in strong["assessment"]

    opposite = study.paper_comparison(adjusted([("a", 1.2, 0.01), ("b", 0.8, 0.2), ("c", 0.95, 0.6)]))
    assert opposite["same_direction_as_paper"] is False
    assert "Not consistently" in opposite["assessment"]


def test_run_study_end_to_end_on_synthetic_database(tmp_path: Path) -> None:
    from engine.tests.test_ml_readmission_model import _create_synthetic_database

    database = tmp_path / "medorch.db"
    _create_synthetic_database(database, row_count=4000)
    output_path = tmp_path / "study.json"
    result = study.run_study(database, output_path)
    written = json.loads(output_path.read_text(encoding="utf-8"))
    assert written["cohort_flow"][0]["step"] == "all_encounters"
    assert {r["exposure"] for r in written["group_rates"]} <= set(study.EXPOSURE_ORDER)
    assert written["paper_comparison"]["verify_against_paper"] is True
    assert "chi_square" in result and "interaction" in result

from __future__ import annotations

import json
from pathlib import Path

import pytest

np = pytest.importorskip("numpy")
pd = pytest.importorskip("pandas")
pytest.importorskip("sklearn")

from engine.ml import fairness_audit as audit  # noqa: E402
from engine.ml import train_readmission_model as trainer  # noqa: E402
from engine.tests.test_ml_readmission_model import _create_synthetic_database  # noqa: E402


def test_collapse_race_labels_missing_as_unknown() -> None:
    frame = pd.DataFrame({"race": ["Caucasian", None, "Asian"]})
    labels, notes = audit.collapse_groups(frame, "race")
    assert labels.tolist() == ["Caucasian", "Unknown", "Asian"]
    assert notes == []


def test_collapse_gender_drops_tiny_unknown_group_and_says_so() -> None:
    frame = pd.DataFrame({"gender": ["Male"] * 100 + ["Female"] * 100 + ["Unknown/Invalid"] * 3})
    labels, notes = audit.collapse_groups(frame, "gender")
    assert labels.isna().sum() == 3
    assert any("Unknown/Invalid" in note and "dropped" in note for note in notes)


def test_collapse_age_into_four_bands() -> None:
    frame = pd.DataFrame({"age": ["[10-20)", "[50-60)", "[70-80)", "[90-100)", None]})
    labels, _ = audit.collapse_groups(frame, "age_band")
    assert labels.tolist() == ["<40", "40-59", "60-79", "80+", "Unknown"]


def test_small_groups_are_suppressed_not_reported_with_false_precision() -> None:
    y = np.array([1, 0, 1, 0, 0] * 4)
    proba = np.linspace(0.05, 0.95, len(y))
    result = audit.group_metrics(y, proba, 0.5)
    assert result["sufficient_data"] is False
    assert "roc_auc" not in result and "recall" not in result
    assert "Suppressed" in result["note"]


def test_group_metrics_known_values() -> None:
    rng = np.random.default_rng(3)
    y = np.array([1] * 40 + [0] * 160)
    proba = np.concatenate([np.full(30, 0.8), np.full(10, 0.2), np.full(20, 0.8), np.full(140, 0.2)])
    result = audit.group_metrics(y, proba, 0.5, resamples=50)
    assert result["sufficient_data"] is True
    assert result["n"] == 200 and result["readmissions"] == 40
    assert result["recall"] == pytest.approx(0.75)
    assert result["false_positive_rate"] == pytest.approx(20 / 160)
    assert result["precision"] == pytest.approx(30 / 50)
    assert result["recall_ci95"][0] < 0.75 < result["recall_ci95"][1]
    assert result["calibration_gap"] == pytest.approx(result["mean_predicted_risk"] - 0.2)
    _ = rng


def _group(recall: float, fpr: float, ci_half: float = 0.02) -> dict:
    return {
        "sufficient_data": True,
        "recall": recall,
        "recall_ci95": [recall - ci_half, recall + ci_half],
        "false_positive_rate": fpr,
        "false_positive_rate_ci95": [fpr - ci_half, fpr + ci_half],
    }


def test_gaps_are_flagged_only_above_review_threshold() -> None:
    groups = {"A": _group(0.40, 0.20), "B": _group(0.55, 0.22), "tiny": {"sufficient_data": False}}
    gaps = audit.compute_gaps(groups)
    assert gaps["recall"]["gap"] == pytest.approx(0.15)
    assert gaps["recall"]["flagged"] is True
    assert gaps["recall"]["lowest_group"] == "A" and gaps["recall"]["highest_group"] == "B"
    assert gaps["false_positive_rate"]["flagged"] is False
    assert gaps["recall"]["intervals_overlap"] is False


def test_gaps_empty_when_fewer_than_two_eligible_groups() -> None:
    assert audit.compute_gaps({"A": _group(0.4, 0.2), "tiny": {"sufficient_data": False}}) == {}


def test_interpretation_is_deterministic_and_mentions_noise_when_intervals_overlap() -> None:
    groups = {"A": _group(0.40, 0.20, ci_half=0.20), "B": _group(0.55, 0.20, ci_half=0.20), "tiny": {"sufficient_data": False}}
    gaps = audit.compute_gaps(groups)
    text = audit.interpret("race", groups, gaps, ["Note."])
    assert "exceeds the 0.10 review threshold" in text
    assert "may be sampling noise" in text
    assert "Not reported (too few cases): tiny." in text
    assert text.endswith("Note.")
    assert text == audit.interpret("race", groups, gaps, ["Note."])


def test_end_to_end_audit_writes_complete_artifact(tmp_path: Path, monkeypatch) -> None:
    db_dir = tmp_path / "database"
    db_dir.mkdir()
    _create_synthetic_database(db_dir / "medorch.db", row_count=1500)
    artifacts = tmp_path / "artifacts"
    monkeypatch.setattr(trainer, "PROJECT_ROOT", tmp_path)
    monkeypatch.setattr(trainer, "ARTIFACT_DIR", artifacts)
    monkeypatch.setattr(trainer, "MODEL_PATH", artifacts / "model.joblib")
    monkeypatch.setattr(trainer, "METRICS_PATH", artifacts / "metrics.json")
    trainer.main()

    audit.run_audit(db_dir / "medorch.db", artifacts / "model.joblib", artifacts / "fairness.json", resamples=30)
    written = json.loads((artifacts / "fairness.json").read_text(encoding="utf-8"))
    assert set(written["attributes"]) == {"race", "gender", "age_band"}
    assert "not a fairness certification" in written["caveat"]
    for section in written["attributes"].values():
        assert section["interpretation"]
        assert section["groups"]

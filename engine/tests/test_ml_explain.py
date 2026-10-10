from __future__ import annotations

import json
import sqlite3
from pathlib import Path

import pytest

np = pytest.importorskip("numpy")
pytest.importorskip("sklearn")
pytest.importorskip("pandas")
pytest.importorskip("shap")

from engine.ml import explain_model as explainer  # noqa: E402
from engine.ml import train_readmission_model as trainer  # noqa: E402
from engine.ml.features import CATEGORICAL_COLUMNS, parse_id_mappings  # noqa: E402
from engine.tests.test_ml_readmission_model import _create_synthetic_database  # noqa: E402


@pytest.mark.parametrize(
    ("transformed", "expected"),
    [
        ("categorical__race_Caucasian", "race"),
        ("categorical__diag_1_group_Diabetes", "diag_1_group"),
        ("categorical__glyburide_metformin_No", "glyburide_metformin"),
        ("categorical__glyburide_Steady", "glyburide"),
        ("categorical__discharge_disposition_id_22", "discharge_disposition_id"),
        ("categorical__a1cresult_>8", "a1cresult"),
        ("numeric__time_in_hospital", "time_in_hospital"),
        ("numeric__num_med_changes", "num_med_changes"),
    ],
)
def test_source_feature_mapping(transformed: str, expected: str) -> None:
    assert explainer.source_feature_for(transformed) == expected


def test_unmappable_feature_raises() -> None:
    with pytest.raises(ValueError):
        explainer.source_feature_for("categorical__mystery_value")


def test_aggregate_sums_one_hot_columns_back_to_source_feature() -> None:
    names = ["categorical__race_A", "categorical__race_B", "numeric__time_in_hospital", "categorical__gender_F"]
    shap = np.array([[0.1, 0.2, 0.5, -0.3], [0.0, -0.4, 0.1, 0.2]])
    aggregated, features = explainer.aggregate_shap_to_features(shap, names)
    assert features == ["race", "time_in_hospital", "gender"]
    np.testing.assert_allclose(aggregated, [[0.3, 0.5, -0.3], [-0.4, 0.1, 0.2]])
    np.testing.assert_allclose(aggregated.sum(axis=1), shap.sum(axis=1))


def test_logistic_regression_contributions_are_additive() -> None:
    from sklearn.linear_model import LogisticRegression

    rng = np.random.default_rng(0)
    X = rng.normal(size=(200, 5))
    y = (X[:, 0] + rng.normal(size=200) > 0).astype(int)
    model = LogisticRegression().fit(X, y)
    contributions = explainer._raw_shap_values(model, X[:10], X)
    expected = model.decision_function(X[:10]) - model.decision_function(X).mean()
    np.testing.assert_allclose(contributions.sum(axis=1), expected, atol=1e-8)


def test_parse_id_mappings_handles_stacked_tables_and_quoted_commas() -> None:
    text = (
        "admission_type_id,description\n1,Emergency\n2,Urgent\n\n"
        "discharge_disposition_id,description\n1,Discharged to home\n19,\"Expired at home. Medicaid only, hospice.\"\n\n"
        "admission_source_id,description\n7,Emergency Room\n"
    )
    mappings = parse_id_mappings(text)
    assert mappings["admission_type_id"] == {1: "Emergency", 2: "Urgent"}
    assert mappings["discharge_disposition_id"][19] == "Expired at home. Medicaid only, hospice."
    assert mappings["admission_source_id"] == {7: "Emergency Room"}


def test_label_value_maps_codes_and_handles_missing() -> None:
    mappings = {"discharge_disposition_id": {1: "Discharged to home"}}
    assert explainer._label_value("discharge_disposition_id", 1, mappings) == "Discharged to home"
    assert explainer._label_value("discharge_disposition_id", 999, mappings) == "999"
    assert explainer._label_value("number_inpatient", 5.0, mappings) == "5"
    assert explainer._label_value("race", None, mappings) == "missing"


def test_end_to_end_explanations_write_json_and_table(tmp_path: Path, monkeypatch) -> None:
    db_dir = tmp_path / "database"
    db_dir.mkdir()
    db_path = db_dir / "medorch.db"
    _create_synthetic_database(db_path, row_count=900)
    artifacts = tmp_path / "artifacts"
    monkeypatch.setattr(trainer, "PROJECT_ROOT", tmp_path)
    monkeypatch.setattr(trainer, "ARTIFACT_DIR", artifacts)
    monkeypatch.setattr(trainer, "MODEL_PATH", artifacts / "model.joblib")
    monkeypatch.setattr(trainer, "METRICS_PATH", artifacts / "metrics.json")
    trainer.main()

    result = explainer.run_explanations(
        db_path, artifacts / "model.joblib", artifacts / "explanations.json",
        global_sample_size=100, local_row_count=15, id_mapping_path=None,
    )

    written = json.loads((artifacts / "explanations.json").read_text(encoding="utf-8"))
    assert written["model_version"] == result["model_version"]
    assert 0 < len(written["global_importance"]) <= explainer.GLOBAL_TOP_FEATURES
    importances = [e["mean_abs_contribution"] for e in written["global_importance"]]
    assert importances == sorted(importances, reverse=True)
    assert all(e["feature"] in explainer.ALL_SOURCE_FEATURES for e in written["global_importance"])
    assert "log-odds" in written["score_scale"]

    with sqlite3.connect(db_path) as connection:
        count, distinct = connection.execute(
            f"SELECT COUNT(*), COUNT(DISTINCT encounter_id) FROM {explainer.TABLE_NAME}"
        ).fetchone()
        ranks = {r[0] for r in connection.execute(f"SELECT DISTINCT rank FROM {explainer.TABLE_NAME}")}
    assert distinct == 15
    assert count == 15 * explainer.LOCAL_TOP_FEATURES
    assert ranks == set(range(1, explainer.LOCAL_TOP_FEATURES + 1))
    assert set(CATEGORICAL_COLUMNS) >= {"race"}

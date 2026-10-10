"""Tests for the readmission-risk training/scoring pipeline.

These tests use a small synthetic in-memory-shaped SQLite database, not the
full 100k-row bundled dataset, and skip entirely if scikit-learn/pandas
aren't installed — the ML pipeline is an optional capability, not a
requirement for the core engine to run and test.
"""

from __future__ import annotations

from pathlib import Path
import random
import sqlite3

import pytest

pytest.importorskip("sklearn")
pytest.importorskip("pandas")
pytest.importorskip("joblib")

from engine.ml.train_readmission_model import (  # noqa: E402
    CATEGORICAL_COLUMNS,
    NUMERIC_COLUMNS,
    build_pipeline,
    load_dataset,
)


def _create_synthetic_database(path: Path, row_count: int = 400) -> None:
    columns = [
        "encounter_id INTEGER", "patient_nbr INTEGER", "race TEXT", "gender TEXT", "age TEXT",
        "admission_type_id INTEGER", "discharge_disposition_id INTEGER", "admission_source_id INTEGER",
        "time_in_hospital INTEGER", "num_lab_procedures INTEGER", "num_procedures INTEGER",
        "num_medications INTEGER", "number_outpatient INTEGER", "number_emergency INTEGER",
        "number_inpatient INTEGER", "diag_1 TEXT", "diag_2 TEXT", "diag_3 TEXT",
        "number_diagnoses INTEGER", "max_glu_serum TEXT", "a1cresult TEXT", "change TEXT",
        "diabetesmed TEXT", "readmitted TEXT",
    ]
    medication_columns = [
        "metformin", "repaglinide", "nateglinide", "chlorpropamide", "glimepiride",
        "acetohexamide", "glipizide", "glyburide", "tolbutamide", "pioglitazone",
        "rosiglitazone", "acarbose", "miglitol", "troglitazone", "tolazamide",
        "examide", "citoglipton", "insulin", "glyburide_metformin",
        "glipizide_metformin", "glimepiride_pioglitazone",
        "metformin_rosiglitazone", "metformin_pioglitazone",
    ]
    columns += [f"{col} TEXT" for col in medication_columns]

    rng = random.Random(42)
    with sqlite3.connect(path) as connection:
        connection.execute(f"CREATE TABLE hospital_readmissions ({', '.join(columns)})")
        rows = []
        for i in range(row_count):
            patient_nbr = i // 2  # some patients have 2 encounters, to exercise group splitting
            base = [
                i, patient_nbr, rng.choice(["Caucasian", "AfricanAmerican"]), rng.choice(["Male", "Female"]),
                rng.choice(["[40-50)", "[50-60)", "[60-70)"]), rng.choice([1, 2, 3]), rng.choice([1, 1, 1, 2, 11]),
                rng.choice([1, 7]), rng.randint(1, 14), rng.randint(1, 80), rng.randint(0, 6),
                rng.randint(1, 30), rng.randint(0, 3), rng.randint(0, 2), rng.randint(0, 2),
                str(rng.randint(250, 400)), str(rng.randint(250, 400)), str(rng.randint(250, 400)),
                rng.randint(1, 9), rng.choice([None, ">200", "Norm"]), rng.choice([None, ">7", "Norm"]),
                rng.choice(["No", "Ch"]), rng.choice(["No", "Yes"]),
                rng.choice(["NO", "<30", ">30"]),
            ]
            base += [rng.choice(["No", "Steady"]) for _ in medication_columns]
            rows.append(base)
        placeholders = ", ".join("?" * len(columns))
        connection.executemany(f"INSERT INTO hospital_readmissions VALUES ({placeholders})", rows)


def test_load_dataset_adds_diagnosis_groups_and_target(tmp_path: Path) -> None:
    db_path = tmp_path / "synthetic.db"
    _create_synthetic_database(db_path)

    frame = load_dataset(db_path)
    assert "diag_1_group" in frame.columns
    assert "target" in frame.columns
    assert set(frame["target"].unique()) <= {0, 1}
    assert (frame["target"] == (frame["readmitted"] == "<30").astype(int)).all()


def test_pipeline_trains_and_predicts_probabilities(tmp_path: Path) -> None:
    from sklearn.linear_model import LogisticRegression

    db_path = tmp_path / "synthetic.db"
    _create_synthetic_database(db_path)
    frame = load_dataset(db_path)

    feature_columns = CATEGORICAL_COLUMNS + NUMERIC_COLUMNS
    pipeline = build_pipeline(LogisticRegression(max_iter=500))
    pipeline.fit(frame[feature_columns], frame["target"])

    probabilities = pipeline.predict_proba(frame[feature_columns])[:, 1]
    assert len(probabilities) == len(frame)
    assert (probabilities >= 0).all() and (probabilities <= 1).all()


def test_pipeline_handles_unseen_categories_gracefully(tmp_path: Path) -> None:
    """A category never seen during training (e.g. a new diagnosis group)
    must not crash prediction — handle_unknown='ignore' on the encoder is
    what guarantees this."""
    from sklearn.linear_model import LogisticRegression

    db_path = tmp_path / "synthetic.db"
    _create_synthetic_database(db_path)
    frame = load_dataset(db_path)
    feature_columns = CATEGORICAL_COLUMNS + NUMERIC_COLUMNS

    train = frame.iloc[:300]
    unseen = frame.iloc[300:301].copy()
    unseen["race"] = "NeverSeenBefore"

    pipeline = build_pipeline(LogisticRegression(max_iter=500))
    pipeline.fit(train[feature_columns], train["target"])
    probabilities = pipeline.predict_proba(unseen[feature_columns])[:, 1]
    assert len(probabilities) == 1


import numpy as np  # noqa: E402

from engine.ml import train_readmission_model as trainer  # noqa: E402


def test_cohort_excludes_death_and_hospice_from_training_frame(tmp_path: Path) -> None:
    db_path = tmp_path / "synthetic.db"
    _create_synthetic_database(db_path)
    frame = load_dataset(db_path)
    assert (frame.loc[frame["discharge_disposition_id"] == 11, "in_scope"] == 0).all()
    assert (frame.loc[frame["discharge_disposition_id"] != 11, "in_scope"] == 1).all()
    assert frame["in_scope"].sum() < len(frame)


def test_three_way_split_never_shares_a_patient_across_partitions(tmp_path: Path) -> None:
    db_path = tmp_path / "synthetic.db"
    _create_synthetic_database(db_path, row_count=600)
    frame = load_dataset(db_path)
    train_idx, val_idx, test_idx = trainer.split_by_patient(frame["patient_nbr"])

    train_p = set(frame.iloc[train_idx]["patient_nbr"])
    val_p = set(frame.iloc[val_idx]["patient_nbr"])
    test_p = set(frame.iloc[test_idx]["patient_nbr"])
    assert not (train_p & val_p) and not (train_p & test_p) and not (val_p & test_p)
    assert len(train_idx) + len(val_idx) + len(test_idx) == len(frame)
    assert 0.5 < len(train_idx) / len(frame) < 0.7


def test_top_decile_threshold_flags_about_ten_percent() -> None:
    rng = np.random.default_rng(0)
    proba = rng.uniform(0, 1, 2000)
    y = (rng.uniform(0, 1, 2000) < proba * 0.3).astype(int)
    thresholds = trainer.select_thresholds(y, proba)
    flagged = float((proba >= thresholds["top_decile"]).mean())
    assert 0.09 <= flagged <= 0.11
    assert 0.0 <= thresholds["max_f1"] <= 1.0


def test_metrics_at_threshold_known_confusion_matrix() -> None:
    y = np.array([1, 1, 0, 0, 0, 1])
    p = np.array([0.9, 0.2, 0.8, 0.1, 0.3, 0.7])
    result = trainer.metrics_at_threshold(y, p, 0.5)
    assert result["confusion_matrix"] == [[2, 1], [1, 2]]
    assert result["recall"] == pytest.approx(0.6667, abs=1e-4)
    assert result["precision"] == pytest.approx(0.6667, abs=1e-4)
    assert result["specificity"] == pytest.approx(0.6667, abs=1e-4)
    assert result["flagged_fraction"] == 0.5


def test_calibration_bins_and_curve_downsampling() -> None:
    rng = np.random.default_rng(1)
    proba = rng.uniform(0, 1, 1000)
    y = (rng.uniform(0, 1, 1000) < proba).astype(int)
    bins = trainer.calibration_bins(y, proba)
    assert len(bins) == 10
    assert sum(b["count"] for b in bins) == 1000
    assert [b["mean_predicted"] for b in bins] == sorted(b["mean_predicted"] for b in bins)

    points = [{"x": i} for i in range(5000)]
    sampled = trainer.downsample_curve(points, limit=100)
    assert len(sampled) <= 100
    assert sampled[0] == {"x": 0} and sampled[-1] == {"x": 4999}


def test_bootstrap_intervals_bracket_the_point_estimate() -> None:
    from sklearn.metrics import roc_auc_score

    rng = np.random.default_rng(2)
    proba = rng.uniform(0, 1, 800)
    y = (rng.uniform(0, 1, 800) < proba * 0.5).astype(int)
    intervals = trainer.bootstrap_auc_intervals(y, proba, resamples=200)
    low, high = intervals["roc_auc_ci95"]
    assert low < roc_auc_score(y, proba) < high


def test_end_to_end_training_writes_complete_metrics_artifact(tmp_path: Path, monkeypatch) -> None:
    import json
    import joblib

    db_dir = tmp_path / "database"
    db_dir.mkdir()
    _create_synthetic_database(db_dir / "medorch.db", row_count=900)
    artifact_dir = tmp_path / "artifacts"
    monkeypatch.setattr(trainer, "PROJECT_ROOT", tmp_path)
    monkeypatch.setattr(trainer, "ARTIFACT_DIR", artifact_dir)
    monkeypatch.setattr(trainer, "MODEL_PATH", artifact_dir / "model.joblib")
    monkeypatch.setattr(trainer, "METRICS_PATH", artifact_dir / "metrics.json")

    trainer.main()

    metrics = json.loads((artifact_dir / "metrics.json").read_text(encoding="utf-8"))
    for key in (
        "roc_auc", "pr_auc", "roc_auc_ci95", "pr_auc_ci95", "brier_score", "roc_curve", "pr_curve",
        "calibration_curve", "threshold_analysis", "cohort", "feature_list", "literature_context",
        "known_limitations", "operating_threshold", "selected_metrics",
    ):
        assert key in metrics, key
    assert set(metrics["threshold_analysis"]) == {"default_0.5", "max_f1", "top_decile"}
    assert metrics["cohort"]["excluded_rows"]["total"] > 0
    assert metrics["cohort"]["in_scope_rows"] + metrics["cohort"]["excluded_rows"]["total"] == metrics["cohort"]["total_rows"]
    fprs = [point["fpr"] for point in metrics["roc_curve"]]
    assert fprs == sorted(fprs)
    assert metrics["roc_auc_ci95"][0] <= metrics["roc_auc"] <= metrics["roc_auc_ci95"][1]

    bundle = joblib.load(artifact_dir / "model.joblib")
    assert {"pipeline", "explain_pipeline", "operating_threshold"} <= set(bundle)

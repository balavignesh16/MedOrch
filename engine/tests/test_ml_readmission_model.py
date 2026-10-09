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
                rng.choice(["[40-50)", "[50-60)", "[60-70)"]), rng.choice([1, 2, 3]), rng.choice([1, 2]),
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

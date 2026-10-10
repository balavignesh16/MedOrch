"""Scores every encounter with the trained readmission-risk model and
writes the result into the bundled analytics database as new columns.

This is an offline, one-time (re-run on retrain) data-preparation step run
by a developer/operator — never something the AI engine's read-only,
guarded SQL execution path does at request time. It uses a writable
connection deliberately, outside the analytics engine's runtime, which is
why this script lives under engine/ml/ rather than being reachable from
engine/main.py.

Usage:
    engine/venv/Scripts/python.exe -m engine.ml.apply_predictions
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

import joblib

try:
    from ..config import PROJECT_ROOT
    from .train_readmission_model import MODEL_PATH, load_dataset
except ImportError:
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from config import PROJECT_ROOT
    from train_readmission_model import MODEL_PATH, load_dataset

RISK_COLUMN = "predicted_readmission_risk"
MODEL_VERSION_COLUMN = "predicted_readmission_risk_model_version"
IN_SCOPE_COLUMN = "predicted_readmission_risk_in_scope"


def main() -> None:
    if not MODEL_PATH.is_file():
        raise SystemExit(
            f"No trained model found at {MODEL_PATH}. Run "
            "'python -m engine.ml.train_readmission_model' first."
        )

    bundle = joblib.load(MODEL_PATH)
    pipeline = bundle["pipeline"]
    feature_columns = bundle["feature_columns"]
    model_version = bundle["model_version"]

    database_path = PROJECT_ROOT / "database" / "medorch.db"
    frame = load_dataset(database_path)
    risk_scores = pipeline.predict_proba(frame[feature_columns])[:, 1]

    with sqlite3.connect(database_path) as connection:
        existing_columns = {row[1] for row in connection.execute("PRAGMA table_info(hospital_readmissions)")}
        if RISK_COLUMN not in existing_columns:
            connection.execute(f"ALTER TABLE hospital_readmissions ADD COLUMN {RISK_COLUMN} REAL")
        if MODEL_VERSION_COLUMN not in existing_columns:
            connection.execute(f"ALTER TABLE hospital_readmissions ADD COLUMN {MODEL_VERSION_COLUMN} TEXT")
        if IN_SCOPE_COLUMN not in existing_columns:
            connection.execute(f"ALTER TABLE hospital_readmissions ADD COLUMN {IN_SCOPE_COLUMN} INTEGER")

        updates = [
            (float(score), model_version, int(in_scope), int(encounter_id))
            for score, in_scope, encounter_id in zip(risk_scores, frame["in_scope"], frame["encounter_id"])
        ]
        # hospital_readmissions has no index on encounter_id, so per-row
        # UPDATE ... WHERE encounter_id = ? is a full scan each time (~10^10
        # row visits). A keyed temp table + one UPDATE FROM is seconds.
        connection.execute("DROP TABLE IF EXISTS temp._risk_scores")
        connection.execute(
            "CREATE TEMP TABLE _risk_scores (encounter_id INTEGER PRIMARY KEY, risk REAL, version TEXT, in_scope INTEGER)"
        )
        connection.executemany(
            "INSERT INTO _risk_scores (risk, version, in_scope, encounter_id) VALUES (?, ?, ?, ?)",
            updates,
        )
        connection.execute(
            f"UPDATE hospital_readmissions SET {RISK_COLUMN} = s.risk, {MODEL_VERSION_COLUMN} = s.version, "
            f"{IN_SCOPE_COLUMN} = s.in_scope FROM _risk_scores AS s "
            "WHERE hospital_readmissions.encounter_id = s.encounter_id"
        )
        connection.commit()

    print(f"Scored {len(updates)} encounters with model version {model_version}.")


if __name__ == "__main__":
    main()

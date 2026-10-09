"""Trains a real, held-out-evaluated early-readmission risk classifier.

This is a demonstration model trained on the bundled, de-identified,
publicly available UCI "Diabetes 130-US hospitals" dataset. It is NOT
clinically validated, NOT approved for clinical decision-making, and does
not satisfy the full model-governance gate the roadmap requires for
production predictive claims (drift monitoring, formal approval/rollback,
full calibration and subgroup fairness review are out of scope here).
What IS real: an actual classifier trained with a group-aware train/test
split (by patient_nbr, so no patient's encounters leak between train and
test), evaluated only on held-out data, with metrics saved alongside the
model so nobody has to take its quality on faith.

Usage:
    engine/venv/Scripts/python.exe -m engine.ml.train_readmission_model
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

try:
    from ..config import PROJECT_ROOT
except ImportError:
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from config import PROJECT_ROOT

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "readmission_risk_model.joblib"
METRICS_PATH = ARTIFACT_DIR / "readmission_risk_metrics.json"

MEDICATION_COLUMNS = [
    "metformin", "repaglinide", "nateglinide", "chlorpropamide", "glimepiride",
    "acetohexamide", "glipizide", "glyburide", "tolbutamide", "pioglitazone",
    "rosiglitazone", "acarbose", "miglitol", "troglitazone", "tolazamide",
    "examide", "citoglipton", "insulin", "glyburide_metformin",
    "glipizide_metformin", "glimepiride_pioglitazone",
    "metformin_rosiglitazone", "metformin_pioglitazone",
]
CATEGORICAL_COLUMNS = [
    "race", "gender", "age", "admission_type_id", "discharge_disposition_id",
    "admission_source_id", "max_glu_serum", "a1cresult", "change", "diabetesmed",
    "diag_1_group", "diag_2_group", "diag_3_group",
] + MEDICATION_COLUMNS
NUMERIC_COLUMNS = [
    "time_in_hospital", "num_lab_procedures", "num_procedures", "num_medications",
    "number_outpatient", "number_emergency", "number_inpatient", "number_diagnoses",
]


def _diag_group(code: object) -> str:
    """Coarse ICD-9 category from the first 3 characters, to keep the
    feature space manageable; exact codes are far too high-cardinality for
    one-hot encoding on this dataset size."""
    text = str(code)
    if text in ("None", "nan", ""):
        return "unknown"
    return text[:3]


def load_dataset(database_path: Path) -> pd.DataFrame:
    with sqlite3.connect(database_path) as connection:
        frame = pd.read_sql_query("SELECT * FROM hospital_readmissions", connection)
    frame["diag_1_group"] = frame["diag_1"].map(_diag_group)
    frame["diag_2_group"] = frame["diag_2"].map(_diag_group)
    frame["diag_3_group"] = frame["diag_3"].map(_diag_group)
    frame["target"] = (frame["readmitted"] == "<30").astype(int)
    return frame


def build_pipeline(estimator) -> Pipeline:
    categorical = Pipeline([
        ("impute", SimpleImputer(strategy="constant", fill_value="unknown")),
        ("encode", OneHotEncoder(handle_unknown="ignore")),
    ])
    numeric = Pipeline([("impute", SimpleImputer(strategy="median"))])
    preprocessor = ColumnTransformer([
        ("categorical", categorical, CATEGORICAL_COLUMNS),
        ("numeric", numeric, NUMERIC_COLUMNS),
    ])
    return Pipeline([("preprocess", preprocessor), ("model", estimator)])


def _evaluate(pipeline: Pipeline, X_test: pd.DataFrame, y_test: pd.Series) -> dict:
    proba = pipeline.predict_proba(X_test)[:, 1]
    predictions = (proba >= 0.5).astype(int)
    return {
        "accuracy": round(accuracy_score(y_test, predictions), 4),
        "precision": round(precision_score(y_test, predictions, zero_division=0), 4),
        "recall": round(recall_score(y_test, predictions, zero_division=0), 4),
        "f1": round(f1_score(y_test, predictions, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_test, proba), 4),
        "brier_score": round(brier_score_loss(y_test, proba), 4),
        "confusion_matrix": confusion_matrix(y_test, predictions).tolist(),
        "test_row_count": int(len(y_test)),
        "test_positive_rate": round(float(y_test.mean()), 4),
    }


def _subgroup_auc(pipeline: Pipeline, X_test: pd.DataFrame, y_test: pd.Series, column: str) -> dict:
    proba = pipeline.predict_proba(X_test)[:, 1]
    results = {}
    for value in X_test[column].dropna().unique():
        mask = X_test[column] == value
        if mask.sum() < 30 or y_test[mask].nunique() < 2:
            continue
        results[str(value)] = round(roc_auc_score(y_test[mask], proba[mask]), 4)
    return results


def main() -> None:
    database_path = PROJECT_ROOT / "database" / "medorch.db"
    frame = load_dataset(database_path)

    feature_columns = CATEGORICAL_COLUMNS + NUMERIC_COLUMNS
    X = frame[feature_columns]
    y = frame["target"]
    groups = frame["patient_nbr"]

    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(splitter.split(X, y, groups=groups))
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    # No class_weight="balanced" here: that biases the *decision threshold*,
    # which is fine for a classifier but corrupts predict_proba's meaning —
    # an early version of this pipeline used it and produced risk scores
    # clustered tightly around 0.5 regardless of actual risk, which would
    # mislead anyone reading the number as a probability. CalibratedClassifierCV
    # instead learns a genuine probability mapping via cross-validation, so
    # predict_proba means what it says.
    candidates = {
        "logistic_regression": CalibratedClassifierCV(
            LogisticRegression(max_iter=2000), method="sigmoid", cv=3
        ),
        "random_forest": CalibratedClassifierCV(
            RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42, n_jobs=-1),
            method="isotonic", cv=3,
        ),
    }

    results = {}
    fitted = {}
    for name, estimator in candidates.items():
        pipeline = build_pipeline(estimator)
        pipeline.fit(X_train, y_train)
        results[name] = _evaluate(pipeline, X_test, y_test)
        fitted[name] = pipeline
        print(f"{name}: {results[name]}")

    best_name = max(results, key=lambda name: results[name]["roc_auc"])
    best_pipeline = fitted[best_name]
    print(f"Selected model: {best_name} (highest held-out ROC-AUC)")

    subgroup_fairness = {
        "race": _subgroup_auc(best_pipeline, X_test, y_test, "race"),
        "gender": _subgroup_auc(best_pipeline, X_test, y_test, "gender"),
    }

    model_version = f"readmission-risk-{best_name}-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": best_pipeline, "feature_columns": feature_columns, "model_version": model_version}, MODEL_PATH)

    metrics = {
        "model_version": model_version,
        "selected_model": best_name,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "training_source": "database/medorch.db:hospital_readmissions (bundled UCI Diabetes 130-US hospitals dataset)",
        "target_definition": "readmitted == '<30' (readmission within 30 days) vs. all other outcomes",
        "split_method": "GroupShuffleSplit by patient_nbr, test_size=0.2, random_state=42 (prevents the same patient's encounters appearing in both train and test)",
        "candidate_results": results,
        "selected_metrics": results[best_name],
        "subgroup_roc_auc": subgroup_fairness,
        "known_limitations": [
            "Not clinically validated; do not use for clinical decisions.",
            "No drift monitoring, formal approval, or rollback process (see ROADMAP.md Phase 5 model-governance gate).",
            "Probabilities are calibrated via cross-validated CalibratedClassifierCV (see brier_score above "
            "for calibration quality), but this has not been externally validated against a held-out "
            "calibration cohort separate from the training data.",
            "Subgroup ROC-AUC is reported for visibility, not fairness certification.",
            "Predictions applied to the full bundled dataset include rows the model was trained on; "
            "scores for those rows may be optimistic relative to true held-out performance.",
        ],
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Saved model to {MODEL_PATH}")
    print(f"Saved metrics to {METRICS_PATH}")


if __name__ == "__main__":
    main()

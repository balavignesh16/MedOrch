"""Trains and rigorously evaluates an early-readmission risk classifier.

This is a demonstration model trained on the bundled, de-identified,
publicly available UCI "Diabetes 130-US hospitals" dataset. It is NOT
clinically validated and NOT approved for clinical decision-making.

Methodology:
- Cohort: encounters ending in death or hospice discharge are excluded from
  training and evaluation (they cannot be readmitted).
- Split: train / validation / test (60/20/20), every split grouped by
  patient_nbr so no patient appears in more than one. Validation is used
  only for model selection and threshold selection; the test set is
  evaluated exactly once, for reporting.
- Probabilities are calibrated (CalibratedClassifierCV). class_weight is
  deliberately NOT used: it distorts predict_proba. The decision threshold
  is chosen explicitly on the validation set instead.

Usage:
    engine/venv/Scripts/python.exe -m engine.ml.train_readmission_model
"""

from __future__ import annotations

import json
import sqlite3
import warnings
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    precision_recall_curve,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

try:
    from ..config import PROJECT_ROOT
    from .features import (
        CATEGORICAL_COLUMNS,
        EXCLUDED_DISCHARGE_DISPOSITIONS,
        MEDICATION_COLUMNS,
        NUMERIC_COLUMNS,
        add_engineered_features,
        exclusion_counts,
    )
except ImportError:
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from config import PROJECT_ROOT
    from features import (
        CATEGORICAL_COLUMNS,
        EXCLUDED_DISCHARGE_DISPOSITIONS,
        MEDICATION_COLUMNS,
        NUMERIC_COLUMNS,
        add_engineered_features,
        exclusion_counts,
    )

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "readmission_risk_model.joblib"
METRICS_PATH = ARTIFACT_DIR / "readmission_risk_metrics.json"

RANDOM_SEED = 42
BOOTSTRAP_RESAMPLES = 1000
CURVE_POINTS = 100
TOP_DECILE_FRACTION = 0.10

__all__ = [
    "CATEGORICAL_COLUMNS", "NUMERIC_COLUMNS", "MEDICATION_COLUMNS",
    "MODEL_PATH", "METRICS_PATH", "ARTIFACT_DIR",
    "load_dataset", "build_pipeline", "split_by_patient", "select_thresholds",
    "metrics_at_threshold", "bootstrap_auc_intervals", "calibration_bins",
    "downsample_curve", "main",
]


def load_dataset(database_path: Path) -> pd.DataFrame:
    with sqlite3.connect(database_path) as connection:
        frame = pd.read_sql_query("SELECT * FROM hospital_readmissions", connection)
    return add_engineered_features(frame)


def build_pipeline(estimator) -> Pipeline:
    categorical = Pipeline([
        ("impute", SimpleImputer(strategy="constant", fill_value="unknown")),
        ("encode", OneHotEncoder(handle_unknown="ignore")),
    ])
    numeric = Pipeline([
        ("impute", SimpleImputer(strategy="median")),
        ("scale", StandardScaler()),
    ])
    preprocessor = ColumnTransformer([
        ("categorical", categorical, CATEGORICAL_COLUMNS),
        ("numeric", numeric, NUMERIC_COLUMNS),
    ])
    return Pipeline([("preprocess", preprocessor), ("model", estimator)])


def split_by_patient(
    groups: pd.Series, seed: int = RANDOM_SEED
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """60/20/20 train/validation/test positional indices, grouped by patient."""
    placeholder = np.zeros(len(groups))
    outer = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=seed)
    train_val_idx, test_idx = next(outer.split(placeholder, groups=groups))
    inner = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=seed)
    inner_train, inner_val = next(inner.split(placeholder[train_val_idx], groups=groups.iloc[train_val_idx]))
    return train_val_idx[inner_train], train_val_idx[inner_val], test_idx


def select_thresholds(y_validation: np.ndarray, proba_validation: np.ndarray) -> dict[str, float]:
    """Both thresholds are chosen on validation data only."""
    precision, recall, thresholds = precision_recall_curve(y_validation, proba_validation)
    with np.errstate(divide="ignore", invalid="ignore"):
        f1 = np.where(precision + recall > 0, 2 * precision * recall / (precision + recall), 0.0)
    best = int(np.argmax(f1[:-1])) if len(thresholds) else 0
    threshold_max_f1 = float(thresholds[best]) if len(thresholds) else 0.5
    threshold_top_decile = float(np.quantile(proba_validation, 1 - TOP_DECILE_FRACTION))
    return {"max_f1": threshold_max_f1, "top_decile": threshold_top_decile}


def metrics_at_threshold(y_true: np.ndarray, proba: np.ndarray, threshold: float) -> dict:
    predicted = proba >= threshold
    actual = np.asarray(y_true).astype(bool)
    tp = int((predicted & actual).sum())
    fp = int((predicted & ~actual).sum())
    fn = int((~predicted & actual).sum())
    tn = int((~predicted & ~actual).sum())
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    specificity = tn / (tn + fp) if (tn + fp) else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    return {
        "threshold": round(float(threshold), 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "specificity": round(specificity, 4),
        "f1": round(f1, 4),
        "accuracy": round((tp + tn) / len(actual), 4),
        "flagged_fraction": round(float(predicted.mean()), 4),
        "confusion_matrix": [[tn, fp], [fn, tp]],
    }


def bootstrap_auc_intervals(
    y_true: np.ndarray, proba: np.ndarray, resamples: int = BOOTSTRAP_RESAMPLES, seed: int = RANDOM_SEED
) -> dict[str, list[float]]:
    rng = np.random.default_rng(seed)
    y_true = np.asarray(y_true)
    proba = np.asarray(proba)
    aucs: list[float] = []
    pr_aucs: list[float] = []
    for _ in range(resamples):
        idx = rng.integers(0, len(y_true), len(y_true))
        sample = y_true[idx]
        if sample.min() == sample.max():
            continue
        aucs.append(roc_auc_score(sample, proba[idx]))
        pr_aucs.append(average_precision_score(sample, proba[idx]))
    return {
        "roc_auc_ci95": [round(float(np.percentile(aucs, 2.5)), 4), round(float(np.percentile(aucs, 97.5)), 4)],
        "pr_auc_ci95": [round(float(np.percentile(pr_aucs, 2.5)), 4), round(float(np.percentile(pr_aucs, 97.5)), 4)],
    }


def downsample_curve(points: list[dict], limit: int = CURVE_POINTS) -> list[dict]:
    if len(points) <= limit:
        return points
    indices = np.unique(np.linspace(0, len(points) - 1, limit).round().astype(int))
    return [points[i] for i in indices]


def calibration_bins(y_true: np.ndarray, proba: np.ndarray, bins: int = 10) -> list[dict]:
    frame = pd.DataFrame({"y": np.asarray(y_true), "p": np.asarray(proba)})
    frame["bin"] = pd.qcut(frame["p"].rank(method="first"), q=bins, labels=False)
    grouped = frame.groupby("bin").agg(mean_predicted=("p", "mean"), observed_rate=("y", "mean"), count=("y", "size"))
    return [
        {
            "mean_predicted": round(float(row.mean_predicted), 4),
            "observed_rate": round(float(row.observed_rate), 4),
            "count": int(row.count),
        }
        for row in grouped.itertuples()
    ]


def _candidates() -> dict[str, tuple]:
    try:
        from lightgbm import LGBMClassifier

        boosted_name = "lightgbm"
        boosted = lambda: LGBMClassifier(  # noqa: E731
            n_estimators=300, learning_rate=0.05, num_leaves=31, min_child_samples=50,
            subsample=0.8, subsample_freq=1, colsample_bytree=0.8, random_state=RANDOM_SEED,
            verbose=-1, n_jobs=-1,
        )
    except ImportError:
        boosted_name = "hist_gradient_boosting"
        boosted = lambda: HistGradientBoostingClassifier(  # noqa: E731
            max_iter=200, learning_rate=0.05, random_state=RANDOM_SEED
        )
    return {
        "logistic_regression": (lambda: LogisticRegression(max_iter=2000), "sigmoid"),
        "random_forest": (
            lambda: RandomForestClassifier(n_estimators=200, max_depth=8, random_state=RANDOM_SEED, n_jobs=-1),
            "isotonic",
        ),
        boosted_name: (boosted, "isotonic"),
    }


def _subgroup_auc(frame: pd.DataFrame, proba: np.ndarray, column: str) -> dict:
    results = {}
    for value in frame[column].dropna().unique():
        mask = (frame[column] == value).to_numpy()
        if mask.sum() < 30 or frame["target"].to_numpy()[mask].min() == frame["target"].to_numpy()[mask].max():
            continue
        results[str(value)] = round(roc_auc_score(frame["target"].to_numpy()[mask], proba[mask]), 4)
    return results


def main() -> None:
    warnings.filterwarnings("ignore", message="X does not have valid feature names")
    database_path = PROJECT_ROOT / "database" / "medorch.db"
    full_frame = load_dataset(database_path)
    excluded_by_reason = exclusion_counts(full_frame)
    frame = full_frame[full_frame["in_scope"] == 1].reset_index(drop=True)

    feature_columns = CATEGORICAL_COLUMNS + NUMERIC_COLUMNS
    train_idx, val_idx, test_idx = split_by_patient(frame["patient_nbr"])
    X_train, y_train = frame.iloc[train_idx][feature_columns], frame.iloc[train_idx]["target"]
    X_val, y_val = frame.iloc[val_idx][feature_columns], frame.iloc[val_idx]["target"].to_numpy()
    test_frame = frame.iloc[test_idx].reset_index(drop=True)
    X_test, y_test = test_frame[feature_columns], test_frame["target"].to_numpy()

    candidate_results: dict[str, dict] = {}
    fitted: dict[str, Pipeline] = {}
    base_factories: dict[str, object] = {}
    for name, (factory, calibration_method) in _candidates().items():
        pipeline = build_pipeline(CalibratedClassifierCV(factory(), method=calibration_method, cv=3))
        pipeline.fit(X_train, y_train)
        proba_val = pipeline.predict_proba(X_val)[:, 1]
        candidate_results[name] = {
            "validation_roc_auc": round(roc_auc_score(y_val, proba_val), 4),
            "validation_pr_auc": round(average_precision_score(y_val, proba_val), 4),
            "validation_brier_score": round(brier_score_loss(y_val, proba_val), 4),
        }
        fitted[name] = pipeline
        base_factories[name] = factory
        print(f"{name}: {candidate_results[name]}")

    best_name = max(
        candidate_results,
        key=lambda n: (candidate_results[n]["validation_roc_auc"], candidate_results[n]["validation_pr_auc"]),
    )
    best_pipeline = fitted[best_name]
    print(f"Selected model: {best_name} (highest validation ROC-AUC)")

    proba_val = best_pipeline.predict_proba(X_val)[:, 1]
    thresholds = select_thresholds(y_val, proba_val)
    operating_threshold = thresholds["max_f1"]

    # Test set: scored exactly once, after every choice above is frozen.
    proba_test = best_pipeline.predict_proba(X_test)[:, 1]
    roc_auc = float(roc_auc_score(y_test, proba_test))
    pr_auc = float(average_precision_score(y_test, proba_test))
    intervals = bootstrap_auc_intervals(y_test, proba_test)

    fpr, tpr, roc_thresholds = roc_curve(y_test, proba_test)
    roc_points = [
        {"fpr": round(float(a), 4), "tpr": round(float(b), 4), "threshold": round(float(min(t, 1.0)), 4)}
        for a, b, t in zip(fpr, tpr, roc_thresholds)
    ]
    precision_c, recall_c, pr_thresholds = precision_recall_curve(y_test, proba_test)
    pr_points = [
        {"recall": round(float(r), 4), "precision": round(float(p), 4), "threshold": round(float(t), 4)}
        for p, r, t in zip(precision_c[:-1], recall_c[:-1], pr_thresholds)
    ]

    threshold_analysis = {
        "default_0.5": metrics_at_threshold(y_test, proba_test, 0.5),
        "max_f1": metrics_at_threshold(y_test, proba_test, thresholds["max_f1"]),
        "top_decile": metrics_at_threshold(y_test, proba_test, thresholds["top_decile"]),
    }
    operating_metrics = threshold_analysis["max_f1"]

    explain_pipeline = build_pipeline(base_factories[best_name]())
    explain_pipeline.fit(X_train, y_train)

    now = datetime.now(timezone.utc)
    model_version = f"readmission-risk-{best_name}-{now.strftime('%Y%m%dT%H%M%SZ')}"

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "pipeline": best_pipeline,
            "explain_pipeline": explain_pipeline,
            "feature_columns": feature_columns,
            "model_version": model_version,
            "operating_threshold": operating_threshold,
            "thresholds": thresholds,
            "test_patient_split_seed": RANDOM_SEED,
        },
        MODEL_PATH,
    )

    def _split_summary(positional: np.ndarray) -> dict:
        part = frame.iloc[positional]
        return {
            "rows": int(len(part)),
            "patients": int(part["patient_nbr"].nunique()),
            "positive_rate": round(float(part["target"].mean()), 4),
        }

    metrics = {
        "model_version": model_version,
        "selected_model": best_name,
        "trained_at_utc": now.isoformat(),
        "training_source": "database/medorch.db:hospital_readmissions (bundled UCI Diabetes 130-US hospitals dataset)",
        "target_definition": "readmitted == '<30' (readmission within 30 days) vs. all other outcomes",
        "split_method": (
            "Three-way split grouped by patient_nbr: 60% train / 20% validation / 20% test "
            f"(GroupShuffleSplit, random_state={RANDOM_SEED}). Validation used only for model and "
            "threshold selection; test evaluated once for reporting."
        ),
        "cohort": {
            "total_rows": int(len(full_frame)),
            "excluded_rows": {
                "expired": excluded_by_reason["expired"],
                "hospice": excluded_by_reason["hospice"],
                "total": int(len(full_frame) - len(frame)),
            },
            "excluded_discharge_dispositions": {str(k): v for k, v in EXCLUDED_DISCHARGE_DISPOSITIONS.items()},
            "in_scope_rows": int(len(frame)),
            "train": _split_summary(train_idx),
            "validation": _split_summary(val_idx),
            "test": _split_summary(test_idx),
        },
        "feature_list": feature_columns,
        "candidate_results": candidate_results,
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier_score": round(brier_score_loss(y_test, proba_test), 4),
        "prevalence": round(float(y_test.mean()), 4),
        **intervals,
        "operating_threshold": round(operating_threshold, 4),
        "thresholds": {k: round(v, 4) for k, v in thresholds.items()},
        "threshold_analysis": threshold_analysis,
        "roc_curve": downsample_curve(roc_points),
        "pr_curve": downsample_curve(pr_points),
        "calibration_curve": calibration_bins(y_test, proba_test),
        "selected_metrics": {
            "roc_auc": round(roc_auc, 4),
            "brier_score": round(brier_score_loss(y_test, proba_test), 4),
            **{k: v for k, v in operating_metrics.items() if k != "threshold"},
            "test_row_count": int(len(y_test)),
            "test_positive_rate": round(float(y_test.mean()), 4),
        },
        "subgroup_roc_auc": {
            "race": _subgroup_auc(test_frame, proba_test, "race"),
            "gender": _subgroup_auc(test_frame, proba_test, "gender"),
            "note": "See readmission_risk_fairness.json for the full subgroup audit.",
        },
        "literature_context": (
            "Published work on this dataset for 30-day readmission generally reports ROC-AUC in roughly "
            "the mid-0.6s to around 0.70 (approximate context, not a citation of an exact figure). "
            "A modest AUC reflects limited signal in these administrative fields rather than a "
            "modelling defect."
        ),
        "known_limitations": [
            "Not clinically validated; do not use for clinical decisions.",
            "No drift monitoring, formal approval, or rollback process.",
            "Probability calibration uses cross-validation inside the training split (not patient-grouped "
            "folds), so calibration may be slightly optimistic; see calibration_curve for the held-out check.",
            "Data span 1999-2008 from 130 US hospitals; practice patterns have changed since.",
            "The data have no timestamps; 'first encounter' elsewhere in the project is a proxy based on encounter_id.",
            "Scores applied to the full dataset include rows used in training; those are optimistic relative "
            "to held-out performance (see predicted_readmission_risk_in_scope).",
        ],
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Saved model to {MODEL_PATH}")
    print(f"Saved metrics to {METRICS_PATH}")
    print(
        f"Test ROC-AUC {roc_auc:.4f} {intervals['roc_auc_ci95']}, PR-AUC {pr_auc:.4f}; "
        f"recall@max_f1 {operating_metrics['recall']}, precision@max_f1 {operating_metrics['precision']}"
    )


if __name__ == "__main__":
    main()

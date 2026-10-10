"""Offline SHAP explanations for the readmission-risk model.

Writes (1) a global-importance JSON artifact and (2) a per-encounter
explanation table, `readmission_risk_explanations`, into medorch.db. Run
after training and scoring; never part of the request-time engine, and the
assistant's single-table SQL guard cannot reach the table it creates.

Explanations are on the base (uncalibrated) model's raw score scale
(log-odds), not on calibrated probability.

Usage:
    engine/venv/Scripts/python.exe -m engine.ml.explain_model
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

try:
    from ..config import PROJECT_ROOT
    from .features import CATEGORICAL_COLUMNS, NUMERIC_COLUMNS, parse_id_mappings
    from .train_readmission_model import ARTIFACT_DIR, MODEL_PATH, load_dataset, split_by_patient
except ImportError:
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from config import PROJECT_ROOT
    from features import CATEGORICAL_COLUMNS, NUMERIC_COLUMNS, parse_id_mappings
    from train_readmission_model import ARTIFACT_DIR, MODEL_PATH, load_dataset, split_by_patient

EXPLANATIONS_PATH = ARTIFACT_DIR / "readmission_risk_explanations.json"
ID_MAPPING_PATH = PROJECT_ROOT / "engine" / "diabetes_data" / "dataset_diabetes" / "IDs_mapping.csv"
TABLE_NAME = "readmission_risk_explanations"
GLOBAL_SAMPLE_SIZE = 2000
LOCAL_ROW_COUNT = 500
LOCAL_TOP_FEATURES = 5
GLOBAL_TOP_FEATURES = 20
SEED = 42

ALL_SOURCE_FEATURES = CATEGORICAL_COLUMNS + NUMERIC_COLUMNS


def source_feature_for(transformed_name: str, source_features: list[str] = ALL_SOURCE_FEATURES) -> str:
    """Map a ColumnTransformer output name ('categorical__diag_1_group_Diabetes',
    'numeric__time_in_hospital') back to the original column it came from."""
    name = transformed_name.split("__", 1)[1] if "__" in transformed_name else transformed_name
    if transformed_name.startswith("numeric__"):
        return name
    best = ""
    for column in source_features:
        if name.startswith(column + "_") and len(column) > len(best):
            best = column
    if not best:
        raise ValueError(f"Cannot map transformed feature {transformed_name!r} to a source column")
    return best


def aggregate_shap_to_features(
    shap_matrix: np.ndarray, transformed_names: list[str], source_features: list[str] = ALL_SOURCE_FEATURES
) -> tuple[np.ndarray, list[str]]:
    """Sum SHAP values of one-hot columns back into one column per original feature."""
    sources = [source_feature_for(name, source_features) for name in transformed_names]
    ordered = list(dict.fromkeys(sources))
    aggregated = np.zeros((shap_matrix.shape[0], len(ordered)))
    index = {feature: i for i, feature in enumerate(ordered)}
    for column, source in enumerate(sources):
        aggregated[:, index[source]] += shap_matrix[:, column]
    return aggregated, ordered


def _raw_shap_values(model, X_dense: np.ndarray, background: np.ndarray) -> np.ndarray:
    from sklearn.linear_model import LogisticRegression

    if isinstance(model, LogisticRegression):
        return (X_dense - background.mean(axis=0)) * model.coef_[0]

    import shap

    values = shap.TreeExplainer(model).shap_values(X_dense)
    if isinstance(values, list):
        values = values[-1]
    values = np.asarray(values)
    if values.ndim == 3:
        values = values[:, :, -1]
    return values


def _label_value(feature: str, value: object, mappings: dict[str, dict[int, str]]) -> str:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return "missing"
    if feature in mappings:
        try:
            return mappings[feature].get(int(value), str(value))
        except (TypeError, ValueError):
            return str(value)
    if isinstance(value, (float, np.floating)) and float(value).is_integer():
        return str(int(value))
    return str(value)


def _direction_summary(feature: str, raw_column: pd.Series, aggregated: np.ndarray) -> dict:
    if feature in NUMERIC_COLUMNS:
        values = pd.to_numeric(raw_column, errors="coerce").to_numpy(dtype=float)
        valid = ~np.isnan(values)
        if valid.sum() > 10 and np.std(values[valid]) > 0 and np.std(aggregated[valid]) > 0:
            corr = float(np.corrcoef(values[valid], aggregated[valid])[0, 1])
            return {
                "kind": "numeric",
                "correlation_with_contribution": round(corr, 3),
                "direction": "higher values raise risk" if corr > 0 else "higher values lower risk",
            }
        return {"kind": "numeric", "correlation_with_contribution": None, "direction": "no clear direction"}

    frame = pd.DataFrame({"value": raw_column.fillna("missing").astype(str).to_numpy(), "shap": aggregated})
    grouped = frame.groupby("value")["shap"].agg(["mean", "size"])
    grouped = grouped[grouped["size"] >= 20].sort_values("mean")

    def pack(rows: pd.DataFrame) -> list[dict]:
        return [
            {"value": str(index), "mean_contribution": round(float(r["mean"]), 4), "count": int(r["size"])}
            for index, r in rows.iterrows()
        ]

    return {
        "kind": "categorical",
        "raises_risk_most": pack(grouped.tail(2).iloc[::-1]),
        "lowers_risk_most": pack(grouped.head(2)),
    }


def run_explanations(
    database_path: Path,
    model_path: Path,
    output_path: Path,
    global_sample_size: int = GLOBAL_SAMPLE_SIZE,
    local_row_count: int = LOCAL_ROW_COUNT,
    id_mapping_path: Path | None = ID_MAPPING_PATH,
) -> dict:
    warnings.filterwarnings("ignore", message="X does not have valid feature names")
    bundle = joblib.load(model_path)
    explain_pipeline = bundle["explain_pipeline"]
    pipeline = bundle["pipeline"]
    feature_columns = bundle["feature_columns"]
    model_version = bundle["model_version"]

    full = load_dataset(database_path)
    frame = full[full["in_scope"] == 1].reset_index(drop=True)
    _, _, test_idx = split_by_patient(frame["patient_nbr"], seed=bundle.get("test_patient_split_seed", SEED))
    test_frame = frame.iloc[test_idx]

    preprocess = explain_pipeline.named_steps["preprocess"]
    model = explain_pipeline.named_steps["model"]
    transformed_names = list(preprocess.get_feature_names_out())

    def dense(rows: pd.DataFrame) -> np.ndarray:
        matrix = preprocess.transform(rows[feature_columns])
        return matrix.toarray() if hasattr(matrix, "toarray") else np.asarray(matrix)

    mappings: dict[str, dict[int, str]] = {}
    if id_mapping_path is not None and Path(id_mapping_path).is_file():
        mappings = parse_id_mappings(Path(id_mapping_path).read_text(encoding="utf-8"))

    sample = test_frame.sample(n=min(global_sample_size, len(test_frame)), random_state=SEED)
    X_sample = dense(sample)
    shap_sample = _raw_shap_values(model, X_sample, X_sample)
    aggregated, features = aggregate_shap_to_features(shap_sample, transformed_names)
    mean_abs = np.abs(aggregated).mean(axis=0)
    order = np.argsort(mean_abs)[::-1][:GLOBAL_TOP_FEATURES]
    global_importance = [
        {
            "feature": features[position],
            "mean_abs_contribution": round(float(mean_abs[position]), 4),
            "direction": _direction_summary(features[position], sample[features[position]], aggregated[:, position]),
        }
        for position in order
    ]

    scores = pipeline.predict_proba(frame[feature_columns])[:, 1]
    top_positions = np.argsort(scores)[::-1][:local_row_count]
    top_rows = frame.iloc[top_positions]
    X_top = dense(top_rows)
    shap_top = _raw_shap_values(model, X_top, X_sample)
    agg_top, top_features = aggregate_shap_to_features(shap_top, transformed_names)

    records = []
    for row_number, (_, row) in enumerate(top_rows.iterrows()):
        contributions = agg_top[row_number]
        for rank, feature_pos in enumerate(np.argsort(np.abs(contributions))[::-1][:LOCAL_TOP_FEATURES], start=1):
            feature = top_features[feature_pos]
            records.append(
                (
                    int(row["encounter_id"]),
                    rank,
                    feature,
                    _label_value(feature, row[feature], mappings),
                    round(float(contributions[feature_pos]), 4),
                    model_version,
                )
            )

    with sqlite3.connect(database_path) as connection:
        connection.execute(f"DROP TABLE IF EXISTS {TABLE_NAME}")
        connection.execute(
            f"CREATE TABLE {TABLE_NAME} (encounter_id INTEGER NOT NULL, rank INTEGER NOT NULL, "
            "feature TEXT NOT NULL, feature_value TEXT NOT NULL, contribution REAL NOT NULL, "
            "model_version TEXT NOT NULL, PRIMARY KEY (encounter_id, rank))"
        )
        connection.executemany(f"INSERT INTO {TABLE_NAME} VALUES (?, ?, ?, ?, ?, ?)", records)
        connection.commit()

    output = {
        "model_version": model_version,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "score_scale": "Raw log-odds of the uncalibrated base model; positive values raise predicted risk. "
        "Not calibrated probability.",
        "method": "SHAP (TreeExplainer for tree models, exact linear contributions for logistic regression); "
        "one-hot columns summed back to the original feature.",
        "global_sample": {"rows": int(len(sample)), "source": "held-out test split (in-scope)"},
        "local_explanations": {
            "encounters": int(len(top_rows)),
            "top_features_per_encounter": LOCAL_TOP_FEATURES,
            "table": TABLE_NAME,
            "selection": "highest predicted risk, in-scope encounters",
        },
        "global_importance": global_importance,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2), encoding="utf-8")
    return output


def main() -> None:
    result = run_explanations(PROJECT_ROOT / "database" / "medorch.db", MODEL_PATH, EXPLANATIONS_PATH)
    print(f"Wrote {EXPLANATIONS_PATH}")
    for entry in result["global_importance"][:10]:
        print(f"  {entry['feature']}: {entry['mean_abs_contribution']}")


if __name__ == "__main__":
    main()

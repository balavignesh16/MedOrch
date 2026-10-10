"""Data-quality profile of the bundled UCI Diabetes 130-US hospitals dataset.

Reads the raw source CSV (all 50 columns, '?' as the missing marker) and the
analytics database, and records what was excluded and why, so every analysis
choice downstream can be traced. Offline script; writes
engine/analysis/artifacts/data_quality.json.

Usage:
    engine/venv/Scripts/python.exe -m engine.analysis.data_quality
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from ..config import PROJECT_ROOT
from ..ml.features import EXCLUDED_DISCHARGE_DISPOSITIONS, MEDICATION_COLUMNS, parse_id_mappings

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
QUALITY_PATH = ARTIFACT_DIR / "data_quality.json"
RAW_CSV_PATH = PROJECT_ROOT / "engine" / "diabetes_data" / "dataset_diabetes" / "diabetic_data.csv"
ID_MAPPING_PATH = PROJECT_ROOT / "engine" / "diabetes_data" / "dataset_diabetes" / "IDs_mapping.csv"

EXCLUDED_FROM_DATABASE = {
    "weight": "Missing for almost all encounters; too sparse to use.",
    "payer_code": "Missing for a large share of encounters and a financial rather than clinical field.",
    "medical_specialty": "Missing for about half of encounters; not reliable enough for analysis.",
}

# 'None' in these two columns means the test was not performed, which is
# clinically meaningful and different from a missing value.
NOT_PERFORMED_COLUMNS = {"max_glu_serum": "None", "A1Cresult": "None"}

DEFINITIONS = [
    {
        "term": "Readmission (assistant, dashboards)",
        "definition": "readmitted != 'NO' — any readmission, within or after 30 days.",
        "used_in": "AI assistant answers and population/quality dashboards",
    },
    {
        "term": "30-day readmission (model, research)",
        "definition": "readmitted == '<30' — readmitted within 30 days only.",
        "used_in": "Risk model target, HbA1c study, cohort comparison tool",
    },
    {
        "term": "Encounter vs. patient",
        "definition": "Each row is one hospital encounter; patients can have several. "
        "Counts are encounters unless stated otherwise.",
        "used_in": "Everywhere",
    },
    {
        "term": "In-scope encounter",
        "definition": "Not ending in death or hospice discharge (those cannot be readmitted).",
        "used_in": "Risk model, HbA1c study",
    },
]

LINEAGE = [
    {"id": "uci", "label": "UCI archive zip", "detail": "Diabetes 130-US hospitals, 1999-2008 (fetch_dataset.py)"},
    {"id": "raw", "label": "diabetic_data.csv", "detail": "50 columns, 101,766 encounters, '?' = missing"},
    {"id": "clean", "label": "hospital_readmissions.csv", "detail": "'?' -> NA, column names snake_case"},
    {"id": "db", "label": "medorch.db", "detail": "load_dataset.py drops weight, payer_code, medical_specialty"},
    {"id": "ml", "label": "Offline ML & analysis scripts", "detail": "engine/ml/*, engine/analysis/* (writable, run by a developer)"},
    {"id": "artifacts", "label": "JSON artifacts + scored columns", "detail": "metrics, SHAP, fairness, HbA1c study, risk scores"},
    {"id": "ui", "label": "Dashboards, research, assistant", "detail": "Read-only access; assistant SQL guarded to one table"},
]


def missingness_table(raw: pd.DataFrame) -> list[dict]:
    rows = []
    total = len(raw)
    for column in raw.columns:
        series = raw[column].astype(str)
        missing = int((series == "?").sum())
        not_performed = 0
        if column in NOT_PERFORMED_COLUMNS:
            not_performed = int((series == NOT_PERFORMED_COLUMNS[column]).sum())
        rows.append(
            {
                "column": column,
                "missing": missing,
                "missing_percent": round(100 * missing / total, 2),
                "not_performed": not_performed,
                "not_performed_percent": round(100 * not_performed / total, 2),
                "in_database": True,
            }
        )
    return sorted(rows, key=lambda row: row["missing_percent"], reverse=True)


def repeat_patient_profile(raw: pd.DataFrame) -> dict:
    per_patient = raw.groupby("patient_nbr").size()
    buckets = {"1": int((per_patient == 1).sum()), "2": int((per_patient == 2).sum()), "3": int((per_patient == 3).sum()),
               "4": int((per_patient == 4).sum()), "5+": int((per_patient >= 5).sum())}
    return {
        "encounters": int(len(raw)),
        "patients": int(len(per_patient)),
        "patients_with_multiple_encounters": int((per_patient > 1).sum()),
        "encounters_from_repeat_patients": int(per_patient[per_patient > 1].sum()),
        "max_encounters_for_one_patient": int(per_patient.max()),
        "distribution": buckets,
        "why_it_matters": (
            "Encounters from the same patient are correlated. Random row-level splits would leak a patient's other "
            "encounters into the test set, so the risk model splits by patient, and statistical tests that treat "
            "encounters as independent give optimistic p-values."
        ),
    }


def outcome_balance(raw: pd.DataFrame) -> dict:
    counts = raw["readmitted"].value_counts()
    total = int(len(raw))
    return {
        "total": total,
        "classes": {
            label: {"count": int(counts.get(label, 0)), "percent": round(100 * int(counts.get(label, 0)) / total, 2)}
            for label in ("NO", "<30", ">30")
        },
    }


def exclusion_profile(raw: pd.DataFrame, mappings: dict[str, dict[int, str]]) -> dict:
    labels = mappings.get("discharge_disposition_id", {})
    rows = []
    for code, reason in sorted(EXCLUDED_DISCHARGE_DISPOSITIONS.items()):
        count = int((raw["discharge_disposition_id"] == code).sum())
        rows.append({"code": code, "reason": reason, "description": labels.get(code, ""), "count": count})
    return {"codes": rows, "total_excluded": int(sum(r["count"] for r in rows))}


def database_consistency(raw: pd.DataFrame, database_path: Path) -> dict:
    with sqlite3.connect(database_path) as connection:
        db_columns = [row[1] for row in connection.execute("PRAGMA table_info(hospital_readmissions)")]
        db_rows = connection.execute("SELECT COUNT(*) FROM hospital_readmissions").fetchone()[0]
        db_patients = connection.execute("SELECT COUNT(DISTINCT patient_nbr) FROM hospital_readmissions").fetchone()[0]
    normalized_raw = {c.replace("-", "_").replace(" ", "_").lower() for c in raw.columns}
    return {
        "raw_rows": int(len(raw)),
        "database_rows": int(db_rows),
        "rows_match": int(len(raw)) == int(db_rows),
        "raw_patients": int(raw["patient_nbr"].nunique()),
        "database_patients": int(db_patients),
        "duplicate_encounter_ids_in_raw": int(raw["encounter_id"].duplicated().sum()),
        "source_columns_not_in_database": sorted(normalized_raw - set(db_columns)),
        "database_columns_added_by_scoring": sorted(set(db_columns) - normalized_raw),
    }


def build_profile(raw_csv: Path, database_path: Path, id_mapping_path: Path | None = None) -> dict:
    raw = pd.read_csv(raw_csv, dtype=str, keep_default_na=False)
    raw["encounter_id"] = raw["encounter_id"].astype(int)
    raw["discharge_disposition_id"] = raw["discharge_disposition_id"].astype(int)
    mappings = {}
    if id_mapping_path is not None and Path(id_mapping_path).is_file():
        mappings = parse_id_mappings(Path(id_mapping_path).read_text(encoding="utf-8"))

    missing = missingness_table(raw)
    consistency = database_consistency(raw, database_path)
    for row in missing:
        normalized = row["column"].replace("-", "_").replace(" ", "_").lower()
        row["in_database"] = normalized not in consistency["source_columns_not_in_database"]
        if not row["in_database"]:
            row["exclusion_reason"] = EXCLUDED_FROM_DATABASE.get(normalized, "Excluded by the loader.")

    medication_prevalence = []
    for column in MEDICATION_COLUMNS:
        source = next((c for c in raw.columns if c.replace("-", "_").lower() == column), None)
        if source is None:
            continue
        counts = raw[source].value_counts()
        total = len(raw)
        medication_prevalence.append(
            {"drug": column, **{label: int(counts.get(label, 0)) for label in ("No", "Steady", "Up", "Down")},
             "prescribed_percent": round(100 * (total - int(counts.get("No", 0))) / total, 2)}
        )

    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "source": "engine/diabetes_data/dataset_diabetes/diabetic_data.csv (UCI Diabetes 130-US hospitals, 1999-2008)",
        "missingness": missing,
        "excluded_columns": EXCLUDED_FROM_DATABASE,
        "repeat_patients": repeat_patient_profile(raw),
        "outcome_balance": outcome_balance(raw),
        "cohort_exclusions": exclusion_profile(raw, mappings),
        "definitions": DEFINITIONS,
        "lineage": LINEAGE,
        "database_consistency": consistency,
        "medication_prevalence": medication_prevalence,
    }


def main() -> None:
    profile = build_profile(RAW_CSV_PATH, PROJECT_ROOT / "database" / "medorch.db", ID_MAPPING_PATH)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    QUALITY_PATH.write_text(json.dumps(profile, indent=2), encoding="utf-8")
    print(f"Wrote {QUALITY_PATH}")
    for row in profile["missingness"][:6]:
        print(f"  {row['column']}: {row['missing_percent']}% missing (in database: {row['in_database']})")
    print(f"  repeat patients: {profile['repeat_patients']['patients_with_multiple_encounters']} of {profile['repeat_patients']['patients']}")
    print(f"  consistency: {profile['database_consistency']}")


if __name__ == "__main__":
    main()

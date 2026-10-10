"""Feature engineering and cohort definition shared by training, scoring,
explainability, and the fairness audit, so they can never diverge."""

from __future__ import annotations

import pandas as pd

MEDICATION_COLUMNS = [
    "metformin", "repaglinide", "nateglinide", "chlorpropamide", "glimepiride",
    "acetohexamide", "glipizide", "glyburide", "tolbutamide", "pioglitazone",
    "rosiglitazone", "acarbose", "miglitol", "troglitazone", "tolazamide",
    "examide", "citoglipton", "insulin", "glyburide_metformin",
    "glipizide_metformin", "glimepiride_pioglitazone",
    "metformin_rosiglitazone", "metformin_pioglitazone",
]

# Per IDs_mapping.csv: 11/19/20/21 = expired, 13/14 = hospice. These
# encounters cannot be followed by a readmission.
EXCLUDED_DISCHARGE_DISPOSITIONS = {
    11: "expired",
    19: "expired",
    20: "expired",
    21: "expired",
    13: "hospice",
    14: "hospice",
}

CATEGORICAL_COLUMNS = [
    "race", "gender", "age", "admission_type_id", "discharge_disposition_id",
    "admission_source_id", "max_glu_serum", "a1cresult", "change", "diabetesmed",
    "diag_1_group", "diag_2_group", "diag_3_group",
] + MEDICATION_COLUMNS

NUMERIC_COLUMNS = [
    "time_in_hospital", "num_lab_procedures", "num_procedures", "num_medications",
    "number_outpatient", "number_emergency", "number_inpatient", "number_diagnoses",
    "total_prior_visits", "num_med_changes", "num_meds_active", "age_midpoint",
    "a1c_tested", "insulin_changed",
]

_MISSING_CODES = {"", "?", "none", "nan", "null"}


def icd9_group(code: object) -> str:
    """Diagnosis group per Strack et al. (2014), Table 2."""
    if code is None:
        return "Missing"
    text = str(code).strip()
    if text.lower() in _MISSING_CODES:
        return "Missing"
    if text[0] in ("V", "v", "E", "e"):
        return "Other"
    try:
        number = float(text)
    except ValueError:
        return "Other"
    whole = int(number)
    if whole == 250:
        return "Diabetes"
    if 390 <= whole <= 459 or whole == 785:
        return "Circulatory"
    if 460 <= whole <= 519 or whole == 786:
        return "Respiratory"
    if 520 <= whole <= 579 or whole == 787:
        return "Digestive"
    if 800 <= whole <= 999:
        return "Injury"
    if 710 <= whole <= 739:
        return "Musculoskeletal"
    if 580 <= whole <= 629 or whole == 788:
        return "Genitourinary"
    if 140 <= whole <= 239:
        return "Neoplasms"
    return "Other"


def age_midpoint(bracket: object) -> float | None:
    """'[70-80)' -> 75.0; None when the bracket is missing or malformed."""
    if bracket is None:
        return None
    text = str(bracket).strip()
    if not (text.startswith("[") and text.endswith(")") and "-" in text):
        return None
    try:
        low, high = text[1:-1].split("-")
        return (float(low) + float(high)) / 2
    except ValueError:
        return None


def age_band(bracket: object) -> str:
    """Coarse band used by the fairness audit and the HbA1c study."""
    midpoint = age_midpoint(bracket)
    if midpoint is None:
        return "Unknown"
    if midpoint < 40:
        return "<40"
    if midpoint < 60:
        return "40-59"
    if midpoint < 80:
        return "60-79"
    return "80+"


def add_engineered_features(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    for position in (1, 2, 3):
        result[f"diag_{position}_group"] = result[f"diag_{position}"].map(icd9_group)

    result["total_prior_visits"] = (
        result["number_outpatient"] + result["number_emergency"] + result["number_inpatient"]
    )
    medications = result[MEDICATION_COLUMNS]
    result["num_med_changes"] = medications.isin(["Up", "Down"]).sum(axis=1)
    result["num_meds_active"] = (medications.notna() & (medications != "No")).sum(axis=1)
    result["insulin_changed"] = result["insulin"].isin(["Up", "Down"]).astype(int)
    result["a1c_tested"] = result["a1cresult"].notna().astype(int)
    result["age_midpoint"] = result["age"].map(age_midpoint)
    result["target"] = (result["readmitted"] == "<30").astype(int)
    result["in_scope"] = (~result["discharge_disposition_id"].isin(EXCLUDED_DISCHARGE_DISPOSITIONS)).astype(int)
    return result


def parse_id_mappings(text: str) -> dict[str, dict[int, str]]:
    """Parse the UCI IDs_mapping.csv, which stacks three 'x_id,description'
    tables separated by blank lines, into {column: {id: description}}."""
    import csv
    import io

    mappings: dict[str, dict[int, str]] = {}
    current: dict[int, str] | None = None
    for row in csv.reader(io.StringIO(text)):
        if not row or not any(cell.strip() for cell in row):
            current = None
            continue
        if row[0].endswith("_id") and len(row) > 1 and row[1].strip() == "description":
            current = mappings.setdefault(row[0], {})
            continue
        if current is not None and len(row) > 1:
            try:
                current[int(row[0])] = row[1].strip()
            except ValueError:
                continue
    return mappings


def exclusion_counts(frame: pd.DataFrame) -> dict[str, int]:
    counts: dict[str, int] = {"expired": 0, "hospice": 0}
    for disposition, reason in EXCLUDED_DISCHARGE_DISPOSITIONS.items():
        counts[reason] += int((frame["discharge_disposition_id"] == disposition).sum())
    return counts

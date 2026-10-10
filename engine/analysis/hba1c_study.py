"""Replication-style analysis of HbA1c measurement and 30-day readmission.

Follows the approach of Strack B, DeShazo JP, Gennings C, et al. "Impact of
HbA1c Measurement on Hospital Readmission Rates: Analysis of 70,000
Clinical Database Patient Records." BioMed Research International, 2014 -
the paper that introduced this dataset. It is a replication-style analysis
on the bundled data, not an exact reproduction: cohort rules are documented
below step by step and differ in detail from the paper's.

Offline script; writes engine/analysis/artifacts/hba1c_study.json.

Usage:
    engine/venv/Scripts/python.exe -m engine.analysis.hba1c_study
"""

from __future__ import annotations

import json
import warnings
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats as scipy_stats

from ..config import PROJECT_ROOT
from ..ml.features import age_band
from ..ml.train_readmission_model import load_dataset
from .stats import wilson_interval

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
STUDY_PATH = ARTIFACT_DIR / "hba1c_study.json"

REFERENCE_GROUP = "not_measured"
EXPOSURE_ORDER = ["not_measured", "normal", "high_changed", "high_no_change"]
EXPOSURE_LABELS = {
    "not_measured": "HbA1c not measured",
    "normal": "Measured, normal (Norm or >7)",
    "high_changed": "Measured >8, medication changed",
    "high_no_change": "Measured >8, no medication change",
}
MAJOR_DIAGNOSIS_GROUPS = ["Circulatory", "Diabetes", "Respiratory", "Digestive"]
CITATION = (
    "Strack B, DeShazo JP, Gennings C, et al. Impact of HbA1c Measurement on Hospital Readmission "
    "Rates: Analysis of 70,000 Clinical Database Patient Records. BioMed Research International. 2014."
)


def assign_exposure_group(a1c_result: object, change: object) -> str | None:
    """Exposure group from the HbA1c result and whether medication changed.
    Returns None for values outside the documented coding."""
    if a1c_result is None or (isinstance(a1c_result, float) and np.isnan(a1c_result)):
        return "not_measured"
    if a1c_result in ("Norm", ">7"):
        return "normal"
    if a1c_result == ">8":
        if change == "Ch":
            return "high_changed"
        if change == "No":
            return "high_no_change"
    return None


def collapse_diagnosis_group(group: str) -> str:
    return group if group in MAJOR_DIAGNOSIS_GROUPS else "Other"


def discharge_group(code: object) -> str:
    try:
        value = int(code)
    except (TypeError, ValueError):
        return "other"
    if value == 1:
        return "home"
    if value in (6, 8):
        return "home_health"
    if value in (2, 3, 4, 5, 22, 23, 24, 27, 28, 29, 30):
        return "facility"
    return "other"


def admission_source_group(code: object) -> str:
    try:
        value = int(code)
    except (TypeError, ValueError):
        return "other"
    if value in (1, 2, 3):
        return "referral"
    if value in (4, 5, 6, 10, 18, 19, 22, 25, 26):
        return "transfer"
    if value == 7:
        return "emergency"
    return "other"


def build_cohort(frame: pd.DataFrame) -> tuple[pd.DataFrame, list[dict]]:
    """Apply the documented inclusion steps, recording a CONSORT-style flow.

    The dataset has no dates, so 'first encounter' is the lowest encounter_id
    per patient - a documented proxy for chronological order."""
    flow: list[dict] = []

    def record(step: str, description: str, current: pd.DataFrame) -> None:
        flow.append(
            {
                "step": step,
                "description": description,
                "encounters": int(len(current)),
                "patients": int(current["patient_nbr"].nunique()),
            }
        )

    current = frame
    record(
        "all_encounters",
        "All encounters in the bundled dataset (every encounter is for a diabetic patient by dataset design)",
        current,
    )

    current = current[current["in_scope"] == 1]
    record("exclude_death_hospice", "Excluded encounters ending in death or hospice discharge", current)

    current = current.sort_values("encounter_id").drop_duplicates("patient_nbr", keep="first")
    record(
        "first_encounter_per_patient",
        "Kept one encounter per patient: the lowest encounter_id (proxy for first, as the data has no dates)",
        current,
    )

    current = current[current["gender"].isin(["Male", "Female"])]
    record("valid_gender", "Excluded gender recorded as Unknown/Invalid (too few rows to model)", current)

    cohort = current.copy()
    cohort["exposure"] = [assign_exposure_group(a, c) for a, c in zip(cohort["a1cresult"], cohort["change"])]
    cohort = cohort[cohort["exposure"].notna()]
    record("assignable_exposure", "Excluded encounters whose HbA1c/medication-change coding did not fit an exposure group", cohort)

    cohort["age_band"] = cohort["age"].map(age_band)
    cohort["race"] = cohort["race"].fillna("Unknown")
    cohort["diag_group"] = cohort["diag_1_group"].map(collapse_diagnosis_group)
    cohort["discharge_group"] = cohort["discharge_disposition_id"].map(discharge_group)
    cohort["admission_group"] = cohort["admission_source_id"].map(admission_source_group)
    return cohort.reset_index(drop=True), flow


def group_rate_table(cohort: pd.DataFrame, by: list[str] | str = "exposure") -> list[dict]:
    keys = [by] if isinstance(by, str) else by
    rows = []
    for key_values, part in cohort.groupby(keys, observed=True):
        key_values = key_values if isinstance(key_values, tuple) else (key_values,)
        n = int(len(part))
        events = int(part["target"].sum())
        low, high = wilson_interval(events, n)
        row = dict(zip(keys, key_values))
        row.update({"n": n, "readmitted_within_30_days": events, "rate": round(events / n, 4),
                    "rate_ci95": [round(low, 4), round(high, 4)]})
        rows.append(row)
    if keys == ["exposure"]:
        rows.sort(key=lambda r: EXPOSURE_ORDER.index(r["exposure"]))
        for row in rows:
            row["label"] = EXPOSURE_LABELS[row["exposure"]]
    return rows


def chi_square_test(cohort: pd.DataFrame) -> dict:
    table = pd.crosstab(cohort["exposure"], cohort["target"]).reindex(columns=[0, 1], fill_value=0)
    table = table.loc[[group for group in EXPOSURE_ORDER if group in table.index]]
    chi2, p_value, dof, _ = scipy_stats.chi2_contingency(table.to_numpy())
    n = table.to_numpy().sum()
    cramers_v = float(np.sqrt(chi2 / (n * (min(table.shape) - 1))))
    return {
        "chi2": round(float(chi2), 4),
        "dof": int(dof),
        "p_value": float(p_value),
        "cramers_v": round(cramers_v, 4),
        "n": int(n),
    }


_COVARIATES = (
    "C(age_band) + C(race) + C(gender) + C(admission_group) + C(discharge_group) "
    "+ time_in_hospital + C(diag_group)"
)
_EXPOSURE_TERM = f"C(exposure, Treatment(reference='{REFERENCE_GROUP}'))"


def _fit(formula: str, cohort: pd.DataFrame):
    import statsmodels.formula.api as smf

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        try:
            return smf.logit(formula, data=cohort).fit(disp=0, maxiter=200)
        except Exception:
            return smf.logit(formula, data=cohort).fit(disp=0, maxiter=500, method="bfgs")


def _clean_term_name(name: str) -> str:
    if name.startswith("C(exposure"):
        return name.split("[T.")[1].rstrip("]")
    return name.replace("C(", "").replace(")", "").replace("[T.", ": ").rstrip("]")


def odds_ratio_table(fit) -> list[dict]:
    confidence = fit.conf_int()
    rows = []
    for term in fit.params.index:
        if term == "Intercept":
            continue
        rows.append(
            {
                "term": _clean_term_name(term),
                "is_exposure": term.startswith("C(exposure"),
                "odds_ratio": round(float(np.exp(fit.params[term])), 4),
                "ci95": [round(float(np.exp(confidence.loc[term, 0])), 4), round(float(np.exp(confidence.loc[term, 1])), 4)],
                "p_value": float(fit.pvalues[term]),
            }
        )
    return rows


def fit_adjusted_model(cohort: pd.DataFrame) -> dict:
    fit = _fit(f"target ~ {_EXPOSURE_TERM} + {_COVARIATES}", cohort)
    table = odds_ratio_table(fit)
    return {
        "reference_group": REFERENCE_GROUP,
        "n": int(fit.nobs),
        "adjusted_for": ["age band", "race", "gender", "admission source", "discharge disposition (grouped)",
                         "time in hospital", "primary diagnosis group"],
        "exposure_odds_ratios": [r for r in table if r["is_exposure"]],
        "covariate_odds_ratios": [r for r in table if not r["is_exposure"]],
    }


def interaction_lr_test(cohort: pd.DataFrame) -> dict:
    """Likelihood-ratio test of exposure x primary-diagnosis interaction."""
    reduced = _fit(f"target ~ {_EXPOSURE_TERM} + {_COVARIATES}", cohort)
    full = _fit(f"target ~ {_EXPOSURE_TERM} * C(diag_group) + {_COVARIATES}", cohort)
    statistic = max(0.0, 2 * (full.llf - reduced.llf))
    df = int(full.df_model - reduced.df_model)
    p_value = float(scipy_stats.chi2.sf(statistic, df)) if df > 0 else float("nan")
    significant = bool(df > 0 and p_value < 0.05)
    return {
        "lr_statistic": round(float(statistic), 4),
        "df": df,
        "p_value": p_value,
        "significant_at_0.05": significant,
        "interpretation": (
            "The association between HbA1c measurement and 30-day readmission differs by primary diagnosis group "
            f"(likelihood-ratio test, p = {p_value:.4g})."
            if significant
            else f"No statistically significant difference by primary diagnosis group was detected (p = {p_value:.4g})."
        ),
    }


def paper_comparison(adjusted: dict) -> dict:
    measured = [r for r in adjusted["exposure_odds_ratios"]]
    below_one = [r for r in measured if r["odds_ratio"] < 1]
    significant_below = [r for r in below_one if r["p_value"] < 0.05]
    if measured and len(below_one) == len(measured) and significant_below:
        assessment = "Consistent with the paper's direction, with at least one group individually significant."
    elif measured and len(below_one) == len(measured):
        assessment = (
            "Directionally consistent with the paper (every adjusted odds ratio is below 1), but no individual "
            "group reaches p < 0.05 in this replication-style analysis."
        )
    else:
        assessment = "Not consistently in the direction reported by the paper in this replication-style analysis."
    return {
        "citation": CITATION,
        "headline_finding_of_paper": (
            "HbA1c measurement was associated with lower 30-day readmission rates, and the relationship depended "
            "on the patient's primary diagnosis."
        ),
        "verify_against_paper": True,
        "note": "The paper's headline is stated qualitatively; exact figures are not reproduced here and should "
                "be checked against the publication before being quoted.",
        "our_results": (
            f"{len(below_one)} of {len(measured)} measured groups have an adjusted odds ratio below 1 versus 'not measured' "
            f"({len(significant_below)} significantly so at p < 0.05)."
        ),
        "assessment": assessment,
        "same_direction_as_paper": len(below_one) == len(measured),
    }


def run_study(database_path: Path, output_path: Path) -> dict:
    frame = load_dataset(database_path)
    cohort, flow = build_cohort(frame)
    adjusted = fit_adjusted_model(cohort)
    interaction = interaction_lr_test(cohort)
    output = {
        "title": "HbA1c measurement and 30-day readmission (replication-style analysis)",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "outcome": "readmitted == '<30' (readmission within 30 days)",
        "exposure_definitions": EXPOSURE_LABELS,
        "cohort_flow": flow,
        "group_rates": group_rate_table(cohort),
        "chi_square": chi_square_test(cohort),
        "adjusted_model": adjusted,
        "interaction": interaction,
        "stratified_rates_by_diagnosis": group_rate_table(cohort, ["diag_group", "exposure"]),
        "paper_comparison": paper_comparison(adjusted),
        "limitations": [
            "Observational data: associations are not causal effects.",
            "Not an exact reproduction of the published cohort; selection rules differ in detail.",
            "No dates: 'first encounter' is a proxy based on encounter_id.",
            "HbA1c is not measured for most encounters, and measurement is itself clinically selected.",
            "Data span 1999-2008 from 130 US hospitals.",
        ],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2), encoding="utf-8")
    return output


def main() -> None:
    result = run_study(PROJECT_ROOT / "database" / "medorch.db", STUDY_PATH)
    print(f"Wrote {STUDY_PATH}")
    for step in result["cohort_flow"]:
        print(f"  {step['step']}: {step['encounters']} encounters / {step['patients']} patients")
    for row in result["group_rates"]:
        print(f"  {row['label']}: n={row['n']} rate={row['rate']} CI={row['rate_ci95']}")
    print(f"  chi-square: {result['chi_square']}")
    for row in result["adjusted_model"]["exposure_odds_ratios"]:
        print(f"  OR {row['term']}: {row['odds_ratio']} {row['ci95']} p={row['p_value']:.4g}")
    print(f"  interaction: {result['interaction']['interpretation']}")
    print(f"  vs paper: {result['paper_comparison']['our_results']}")


if __name__ == "__main__":
    main()

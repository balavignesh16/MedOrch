"""Offline subgroup fairness audit for the readmission-risk model.

Evaluated on the held-out test split only, at the model's operating
threshold. Subgroups too small to report with honest precision are
suppressed. Interpretation text is produced by deterministic rules from the
numbers, never by an LLM. This is a visibility tool, not a fairness
certification.

Usage:
    engine/venv/Scripts/python.exe -m engine.ml.fairness_audit
"""

from __future__ import annotations

import json
import warnings
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score

try:
    from ..analysis.stats import intervals_overlap, wilson_interval
    from ..config import PROJECT_ROOT
    from .features import age_band
    from .train_readmission_model import (
        ARTIFACT_DIR,
        MODEL_PATH,
        bootstrap_auc_intervals,
        load_dataset,
        split_by_patient,
    )
except ImportError:
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from analysis.stats import intervals_overlap, wilson_interval
    from config import PROJECT_ROOT
    from features import age_band
    from train_readmission_model import (
        ARTIFACT_DIR,
        MODEL_PATH,
        bootstrap_auc_intervals,
        load_dataset,
        split_by_patient,
    )

FAIRNESS_PATH = ARTIFACT_DIR / "readmission_risk_fairness.json"
GAP_REVIEW_THRESHOLD = 0.10
MIN_GROUP_ROWS = 100
MIN_GROUP_POSITIVES = 10
MIN_GENDER_ROWS = 30
GROUP_BOOTSTRAP_RESAMPLES = 500
ATTRIBUTES = ("race", "gender", "age_band")


def collapse_groups(frame: pd.DataFrame, attribute: str) -> tuple[pd.Series, list[str]]:
    """Return a label per row plus plain-language notes about any rows dropped."""
    notes: list[str] = []
    if attribute == "race":
        return frame["race"].fillna("Unknown"), notes
    if attribute == "age_band":
        return frame["age"].map(age_band), notes
    if attribute == "gender":
        labels = frame["gender"].fillna("Unknown")
        counts = labels.value_counts()
        for value in ("Unknown/Invalid", "Unknown"):
            if value in counts and counts[value] < MIN_GENDER_ROWS:
                notes.append(f"Gender '{value}' (n={int(counts[value])}) was dropped: fewer than {MIN_GENDER_ROWS} rows.")
                labels = labels.where(labels != value)
        return labels, notes
    raise ValueError(f"Unsupported attribute: {attribute}")


def group_metrics(
    y_true: np.ndarray,
    proba: np.ndarray,
    threshold: float,
    resamples: int = GROUP_BOOTSTRAP_RESAMPLES,
) -> dict:
    y_true = np.asarray(y_true).astype(int)
    proba = np.asarray(proba)
    n = int(len(y_true))
    positives = int(y_true.sum())
    prevalence = positives / n if n else 0.0
    predicted = proba >= threshold
    actual = y_true.astype(bool)
    tp = int((predicted & actual).sum())
    fp = int((predicted & ~actual).sum())
    fn = int((~predicted & actual).sum())
    tn = int((~predicted & ~actual).sum())
    sufficient = n >= MIN_GROUP_ROWS and positives >= MIN_GROUP_POSITIVES and (n - positives) >= MIN_GROUP_POSITIVES
    result: dict = {
        "n": n,
        "readmissions": positives,
        "prevalence": round(prevalence, 4),
        "mean_predicted_risk": round(float(proba.mean()), 4) if n else None,
        "calibration_gap": round(float(proba.mean()) - prevalence, 4) if n else None,
        "sufficient_data": sufficient,
    }
    if not sufficient:
        result["note"] = (
            f"Suppressed: needs at least {MIN_GROUP_ROWS} rows and {MIN_GROUP_POSITIVES} cases of each outcome."
        )
        return result

    intervals = bootstrap_auc_intervals(y_true, proba, resamples=resamples)
    recall_ci = wilson_interval(tp, tp + fn)
    fpr_ci = wilson_interval(fp, fp + tn)
    result.update(
        {
            "roc_auc": round(float(roc_auc_score(y_true, proba)), 4),
            "roc_auc_ci95": intervals["roc_auc_ci95"],
            "recall": round(tp / (tp + fn), 4),
            "recall_ci95": [round(recall_ci[0], 4), round(recall_ci[1], 4)],
            "false_positive_rate": round(fp / (fp + tn), 4),
            "false_positive_rate_ci95": [round(fpr_ci[0], 4), round(fpr_ci[1], 4)],
            "precision": round(tp / (tp + fp), 4) if (tp + fp) else None,
            "flagged_fraction": round(float(predicted.mean()), 4),
        }
    )
    return result


def compute_gaps(groups: dict[str, dict], review_threshold: float = GAP_REVIEW_THRESHOLD) -> dict:
    """Best-vs-worst gaps in recall (equal opportunity) and false-positive rate."""
    eligible = {name: g for name, g in groups.items() if g.get("sufficient_data")}
    gaps: dict[str, dict] = {}
    if len(eligible) < 2:
        return gaps
    for key, label in (("recall", "recall"), ("false_positive_rate", "false_positive_rate")):
        ordered = sorted(eligible.items(), key=lambda item: item[1][key])
        low_name, low = ordered[0]
        high_name, high = ordered[-1]
        gap = round(high[key] - low[key], 4)
        overlap = intervals_overlap(tuple(low[f"{key}_ci95"]), tuple(high[f"{key}_ci95"]))
        gaps[label] = {
            "intervals_overlap": overlap,
            "lowest_group": low_name,
            "lowest_value": low[key],
            "highest_group": high_name,
            "highest_value": high[key],
            "gap": gap,
            "flagged": gap > review_threshold,
        }
    return gaps


def interpret(
    attribute: str, groups: dict[str, dict], gaps: dict, notes: list[str], review_threshold: float = GAP_REVIEW_THRESHOLD
) -> str:
    sentences: list[str] = []
    labels = {"recall": "Recall (share of actual readmissions flagged)", "false_positive_rate": "False-positive rate"}
    for key in ("recall", "false_positive_rate"):
        if key not in gaps:
            continue
        g = gaps[key]
        verdict = (
            f"the gap of {g['gap']:.3f} exceeds the {review_threshold:.2f} review threshold"
            if g["flagged"]
            else f"the gap of {g['gap']:.3f} is within the {review_threshold:.2f} review threshold"
        )
        noise = (
            " The two groups' 95% intervals overlap, so this difference may be sampling noise."
            if g["flagged"] and g["intervals_overlap"]
            else (" The 95% intervals do not overlap." if g["flagged"] else "")
        )
        sentences.append(
            f"{labels[key]} ranges from {g['lowest_value']:.3f} ({g['lowest_group']}) to "
            f"{g['highest_value']:.3f} ({g['highest_group']}); {verdict}.{noise}"
        )
    suppressed = sorted(name for name, g in groups.items() if not g.get("sufficient_data"))
    if suppressed:
        sentences.append(f"Not reported (too few cases): {', '.join(suppressed)}.")
    if not gaps:
        sentences.append("Fewer than two groups had enough data to compare.")
    sentences.extend(notes)
    return " ".join(sentences)


def audit_attribute(
    test_frame: pd.DataFrame, proba: np.ndarray, threshold: float, attribute: str, resamples: int = GROUP_BOOTSTRAP_RESAMPLES
) -> dict:
    labels, notes = collapse_groups(test_frame, attribute)
    groups: dict[str, dict] = {}
    for value in sorted(labels.dropna().unique()):
        mask = (labels == value).to_numpy()
        groups[str(value)] = group_metrics(test_frame["target"].to_numpy()[mask], proba[mask], threshold, resamples)
    gaps = compute_gaps(groups)
    return {"groups": groups, "gaps": gaps, "interpretation": interpret(attribute, groups, gaps, notes), "notes": notes}


def run_audit(database_path: Path, model_path: Path, output_path: Path, resamples: int = GROUP_BOOTSTRAP_RESAMPLES) -> dict:
    warnings.filterwarnings("ignore", message="X does not have valid feature names")
    bundle = joblib.load(model_path)
    frame = load_dataset(database_path)
    frame = frame[frame["in_scope"] == 1].reset_index(drop=True)
    _, _, test_idx = split_by_patient(frame["patient_nbr"], seed=bundle.get("test_patient_split_seed", 42))
    test_frame = frame.iloc[test_idx].reset_index(drop=True)
    proba = bundle["pipeline"].predict_proba(test_frame[bundle["feature_columns"]])[:, 1]
    threshold = float(bundle["operating_threshold"])

    output = {
        "model_version": bundle["model_version"],
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "evaluated_on": f"held-out test split, in-scope encounters (n={len(test_frame)})",
        "operating_threshold": round(threshold, 4),
        "gap_review_threshold": GAP_REVIEW_THRESHOLD,
        "suppression_rule": f">= {MIN_GROUP_ROWS} rows and >= {MIN_GROUP_POSITIVES} cases of each outcome",
        "caveat": (
            "Subgroup metrics describe how this demonstration model behaves on historical data. "
            "Differences may reflect different base rates or access to care, not only model bias. "
            "This is a visibility tool, not a fairness certification."
        ),
        "attributes": {a: audit_attribute(test_frame, proba, threshold, a, resamples) for a in ATTRIBUTES},
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2), encoding="utf-8")
    return output


def main() -> None:
    result = run_audit(PROJECT_ROOT / "database" / "medorch.db", MODEL_PATH, FAIRNESS_PATH)
    print(f"Wrote {FAIRNESS_PATH}")
    for attribute, section in result["attributes"].items():
        print(f"[{attribute}] {section['interpretation']}")


if __name__ == "__main__":
    main()

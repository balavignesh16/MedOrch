"""Renders the report's figures from the saved analysis artifacts (no numbers are typed in here)."""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch  # noqa: E402

ROOT = Path(__file__).resolve().parents[3]
ML = ROOT / "engine" / "ml" / "artifacts"
AN = ROOT / "engine" / "analysis" / "artifacts"
OUT = Path(__file__).resolve().parent / "figures"
OUT.mkdir(exist_ok=True)

TEAL, NAVY, ORANGE, GREY, LIGHT = "#0F766E", "#0B3C49", "#EA6A12", "#6B7280", "#E6F2F1"
plt.rcParams.update(
    {
        "font.family": "DejaVu Sans",
        "font.size": 10,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.edgecolor": "#9CA3AF",
        "axes.labelcolor": "#111827",
        "xtick.color": "#374151",
        "ytick.color": "#374151",
        "figure.dpi": 200,
        "savefig.bbox": "tight",
        "savefig.facecolor": "white",
    }
)

metrics = json.loads((ML / "readmission_risk_metrics.json").read_text(encoding="utf-8"))
explain = json.loads((ML / "readmission_risk_explanations.json").read_text(encoding="utf-8"))
fairness = json.loads((ML / "readmission_risk_fairness.json").read_text(encoding="utf-8"))
study = json.loads((AN / "hba1c_study.json").read_text(encoding="utf-8"))
quality = json.loads((AN / "data_quality.json").read_text(encoding="utf-8"))

FEATURE_NAMES = {
    "number_inpatient": "Prior inpatient visits",
    "discharge_disposition_id": "Discharge disposition",
    "total_prior_visits": "Total prior visits",
    "diag_1_group": "Primary diagnosis group",
    "time_in_hospital": "Days in hospital",
    "number_diagnoses": "Number of diagnoses",
    "age_midpoint": "Age",
    "num_medications": "Number of medications",
    "insulin": "Insulin status",
    "num_lab_procedures": "Lab procedures",
    "number_emergency": "Prior emergency visits",
    "number_outpatient": "Prior outpatient visits",
    "num_procedures": "Procedures",
    "admission_source_id": "Admission source",
    "admission_type_id": "Admission type",
    "diag_2_group": "Secondary diagnosis group",
    "diag_3_group": "Tertiary diagnosis group",
    "diabetesmed": "Diabetes medication",
}


def name(feature: str) -> str:
    return FEATURE_NAMES.get(feature, feature.replace("_", " ").capitalize())


def save(fig: plt.Figure, filename: str) -> None:
    fig.savefig(OUT / filename)
    plt.close(fig)
    print("wrote", filename)


# 1. ROC curve ---------------------------------------------------------------------------------
roc = metrics["roc_curve"]
fig, ax = plt.subplots(figsize=(4.4, 4.0))
ax.plot([0, 1], [0, 1], "--", color=GREY, lw=1, label="No skill")
ax.plot([p["fpr"] for p in roc], [p["tpr"] for p in roc], color=TEAL, lw=2.2, label="Model")
ax.set_xlabel("False-positive rate")
ax.set_ylabel("True-positive rate (recall)")
lo, hi = metrics["roc_auc_ci95"]
ax.text(0.58, 0.18, f"ROC-AUC {metrics['roc_auc']:.3f}\n95% CI {lo:.3f}-{hi:.3f}", fontsize=9.5, color=NAVY)
ax.legend(frameon=False, loc="upper left")
ax.set_xlim(0, 1)
ax.set_ylim(0, 1.01)
save(fig, "fig_roc.png")

# 2. Calibration -------------------------------------------------------------------------------
cal = metrics["calibration_curve"]
top = max(max(c["mean_predicted"], c["observed_rate"]) for c in cal) * 1.1
fig, ax = plt.subplots(figsize=(4.4, 4.0))
ax.plot([0, top], [0, top], "--", color=GREY, lw=1, label="Perfect calibration")
ax.plot([c["mean_predicted"] for c in cal], [c["observed_rate"] for c in cal], "o-", color=ORANGE, lw=2, ms=5, label="Model (10 equal-size bins)")
ax.set_xlabel("Mean predicted risk")
ax.set_ylabel("Observed 30-day readmission rate")
ax.legend(frameon=False, loc="upper left")
ax.set_xlim(0, top)
ax.set_ylim(0, top)
save(fig, "fig_calibration.png")

# 3. Threshold comparison ----------------------------------------------------------------------
analysis = metrics["threshold_analysis"]
labels = [("default_0.5", "Default 0.5"), ("max_f1", "Max-F1 (operating)"), ("top_decile", "Top-10% capacity")]
series = [("recall", "Recall", TEAL), ("precision", "Precision", ORANGE), ("flagged_fraction", "Share flagged", NAVY)]
fig, ax = plt.subplots(figsize=(6.4, 3.4))
width = 0.26
for i, (key, label, color) in enumerate(series):
    values = [analysis[k][key] * 100 for k, _ in labels]
    bars = ax.bar([x + (i - 1) * width for x in range(3)], values, width, label=label, color=color)
    for bar, value in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width() / 2, value + 1, f"{value:.1f}", ha="center", fontsize=8)
ax.set_xticks(range(3))
ax.set_xticklabels([f"{text}\n(cutoff {analysis[k]['threshold']:.3f})" for k, text in labels])
ax.set_ylabel("Percent")
ax.set_ylim(0, 75)
ax.legend(frameon=False, ncol=3, loc="upper right")
save(fig, "fig_thresholds.png")

# 4. SHAP importance ---------------------------------------------------------------------------
rows = explain["global_importance"][:12][::-1]
colors = []
for row in rows:
    d = row["direction"]
    if d["kind"] == "numeric" and d.get("correlation_with_contribution") is not None:
        colors.append(ORANGE if d["correlation_with_contribution"] > 0 else "#0891B2")
    else:
        colors.append(TEAL)
fig, ax = plt.subplots(figsize=(6.4, 4.2))
ax.barh([name(r["feature"]) for r in rows], [r["mean_abs_contribution"] for r in rows], color=colors)
ax.set_xlabel("Mean |SHAP value| (log-odds scale, held-out sample)")
ax.text(0.98, 0.04, "orange: higher values raise risk\nteal: categorical feature", transform=ax.transAxes, ha="right", fontsize=8.5, color=GREY)
save(fig, "fig_shap.png")

# 5. Fairness: recall by subgroup --------------------------------------------------------------
points = []
for attribute, label in (("race", "Race"), ("age_band", "Age band"), ("gender", "Gender")):
    for group, values in fairness["attributes"][attribute]["groups"].items():
        if values.get("sufficient_data"):
            lo_hi = values["recall_ci95"]
            points.append((f"{label}: {group} (n={values['n']:,})", values["recall"], lo_hi))
points = points[::-1]
fig, ax = plt.subplots(figsize=(6.4, 4.6))
ys = range(len(points))
ax.errorbar(
    [p[1] * 100 for p in points], list(ys),
    xerr=[[(p[1] - p[2][0]) * 100 for p in points], [(p[2][1] - p[1]) * 100 for p in points]],
    fmt="o", color=TEAL, ecolor="#94A3B8", capsize=3,
)
ax.axvline(metrics["threshold_analysis"]["max_f1"]["recall"] * 100, color=ORANGE, ls="--", lw=1)
ax.text(metrics["threshold_analysis"]["max_f1"]["recall"] * 100 + 0.8, len(points) - 0.7, "overall recall", color=ORANGE, fontsize=8.5)
ax.set_yticks(list(ys))
ax.set_yticklabels([p[0] for p in points], fontsize=8.5)
ax.set_xlabel("Recall at the operating threshold (%), with 95% Wilson interval")
save(fig, "fig_fairness.png")

# 6. HbA1c study -------------------------------------------------------------------------------
short = {"not_measured": "Not measured", "normal": "Normal", "high_changed": ">8, changed", "high_no_change": ">8, no change"}
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7.0, 3.3), gridspec_kw={"width_ratios": [1, 1.1]})
rates = study["group_rates"]
x = range(len(rates))
vals = [r["rate"] * 100 for r in rates]
err = [[(r["rate"] - r["rate_ci95"][0]) * 100 for r in rates], [(r["rate_ci95"][1] - r["rate"]) * 100 for r in rates]]
ax1.bar(x, vals, color=TEAL, yerr=err, capsize=4, error_kw={"ecolor": "#111827", "lw": 1.2})
ax1.set_xticks(list(x))
ax1.set_xticklabels([short[r["exposure"]] for r in rates], rotation=20, ha="right", fontsize=8.5)
ax1.set_ylabel("30-day readmission rate (%)")
ax1.set_ylim(0, 11.5)
ax1.set_title("Unadjusted rate (95% CI)", fontsize=9.5, color=NAVY)
ors = study["adjusted_model"]["exposure_odds_ratios"]
order = ["normal", "high_changed", "high_no_change"]
ors = sorted(ors, key=lambda r: order.index(r["term"]))[::-1]
for i, r in enumerate(ors):
    ax2.plot(r["ci95"], [i, i], color="#94A3B8", lw=2)
    ax2.plot(r["odds_ratio"], i, "o", color=ORANGE if r["p_value"] < 0.05 else TEAL, ms=7)
    ax2.text(1.12, i, f"{r['odds_ratio']:.2f} ({r['ci95'][0]:.2f}-{r['ci95'][1]:.2f}), p={r['p_value']:.3f}", va="center", fontsize=7.8)
ax2.axvline(1, color=GREY, ls="--", lw=1)
ax2.set_yticks(range(len(ors)))
ax2.set_yticklabels([short[r["term"]] for r in ors], fontsize=8.5)
ax2.set_xlim(0.6, 1.9)
ax2.set_xlabel("Adjusted odds ratio vs. not measured")
ax2.set_title("Adjusted odds ratios", fontsize=9.5, color=NAVY)
fig.tight_layout()
save(fig, "fig_hba1c.png")

# 7. Missing data ------------------------------------------------------------------------------
miss = [r for r in quality["missingness"] if r["missing_percent"] > 0 or r["not_performed_percent"] > 0]
miss = sorted(miss, key=lambda r: r["missing_percent"] + r["not_performed_percent"], reverse=True)[:8][::-1]
fig, ax = plt.subplots(figsize=(6.4, 3.6))
labels = [r["column"] + ("  (excluded)" if not r["in_database"] else "") for r in miss]
ax.barh(labels, [r["missing_percent"] for r in miss], color=ORANGE, label="Missing ('?')")
ax.barh(labels, [r["not_performed_percent"] for r in miss], left=[r["missing_percent"] for r in miss], color="#0891B2", label="Test not performed")
ax.set_xlabel("Percent of 101,766 encounters")
ax.set_xlim(0, 100)
ax.legend(frameon=False, loc="lower right")
save(fig, "fig_missing.png")


# 8. Diagrams ----------------------------------------------------------------------------------
def box(ax, x, y, w, h, text, fill=LIGHT, edge=TEAL, size=8.5, bold=False):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.06", fc=fill, ec=edge, lw=1.3))
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=size, color=NAVY, fontweight="bold" if bold else "normal")


def arrow(ax, x1, y1, x2, y2):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>", mutation_scale=11, color=GREY, lw=1.2))


fig, ax = plt.subplots(figsize=(7.0, 3.7))
ax.set_xlim(0, 14)
ax.set_ylim(0, 7.4)
ax.axis("off")
ax.text(0.1, 7.0, "Offline - run by a developer (writable)", fontsize=9, color=GREY)
xs = [0.1, 3.6, 7.1, 10.6]
offline = [
    ("UCI zip\n(raw CSV)", LIGHT, TEAL, False),
    ("Clean + load\n3 sparse columns\ndropped", LIGHT, TEAL, False),
    ("medorch.db\n101,766\nencounters", "#FFF1E6", ORANGE, True),
    ("Model, SHAP,\nfairness, HbA1c\nstudy -> JSON", "#FFF1E6", ORANGE, False),
]
for x, (text, fill, edge, bold) in zip(xs, offline):
    box(ax, x, 4.3, 3.1, 2.3, text, fill=fill, edge=edge, size=8, bold=bold)
for a in xs[:-1]:
    arrow(ax, a + 3.1, 5.45, a + 3.6, 5.45)
ax.text(0.1, 3.7, "Runtime - read-only", fontsize=9, color=GREY)
rx = [0.1, 4.9, 9.7]
runtime = ["Next.js app\ndashboards, research,\npredictive, report", "Go gateway\n(gRPC)", "Python engine\nplanner, SQL guard,\ngrounded answers"]
for x, text in zip(rx, runtime):
    box(ax, x, 0.5, 4.2, 2.3, text, size=8)
arrow(ax, 4.3, 1.65, 4.9, 1.65)
arrow(ax, 9.1, 1.65, 9.7, 1.65)
arrow(ax, 8.65, 4.25, 11.0, 2.85)
arrow(ax, 12.15, 4.25, 12.1, 2.85)
ax.text(0.1, 3.3, "artifacts and database are read, never written, at runtime", fontsize=8, color=GREY)
save(fig, "fig_architecture.png")

fig, ax = plt.subplots(figsize=(7.0, 3.3))
ax.set_xlim(0, 14)
ax.set_ylim(0, 6.6)
ax.axis("off")
top_row = [("1  Question", "plain English"), ("2  Query planner", "strict JSON plan,\nnot prose SQL"), ("3  SQL guard", "one SELECT, one table,\nallow-listed functions")]
bottom_row = [("4  Read-only run", "authorizer, limits,\ntimeout"), ("5  Grounded answer", "every number cites\na result cell"), ("6  Output checks", "identifier scan +\naudit record")]
accent = {"3  SQL guard", "5  Grounded answer"}
for i, (title, sub) in enumerate(top_row):
    x = 0.1 + i * 4.7
    hot = title in accent
    box(ax, x, 3.7, 4.0, 2.2, f"{title}\n{sub}", size=8.3, fill="#FFF1E6" if hot else LIGHT, edge=ORANGE if hot else TEAL)
    if i < 2:
        arrow(ax, x + 4.0, 4.8, x + 4.7, 4.8)
for i, (title, sub) in enumerate(bottom_row):
    x = 0.1 + (2 - i) * 4.7
    hot = title in accent
    box(ax, x, 0.9, 4.0, 2.2, f"{title}\n{sub}", size=8.3, fill="#FFF1E6" if hot else LIGHT, edge=ORANGE if hot else TEAL)
for i in range(2):
    x = 0.1 + (2 - i) * 4.7
    arrow(ax, x, 2.0, x - 0.7, 2.0)
arrow(ax, 11.6, 3.65, 11.6, 3.15)
ax.text(7.0, 0.15, "A rejected query gets one repair attempt; an unverifiable narrative falls back to the verified table.", ha="center", fontsize=8, color=GREY)
save(fig, "fig_assistant_pipeline.png")

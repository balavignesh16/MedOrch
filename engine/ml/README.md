# Predictive readmission-risk model

A real, trained 30-day readmission-risk classifier with a documented
evaluation, explanations, and a subgroup fairness audit. It is a teaching
demonstration on the bundled UCI "Diabetes 130-US hospitals" data (1999-2008).

Everything it produces is computed **offline** by the scripts in this
folder and stored as JSON artifacts plus plain columns/tables in
`medorch.db`. The AI assistant's LLM never "predicts" anything: it reads the
stored `predicted_readmission_risk` column like any other data.

## What this is not

- **Not clinically validated** and not approved for clinical decisions,
  triage, or care planning.
- **Not a live prediction service.** Scores are computed once, offline.
- **Not the full model-governance gate** (no drift monitoring, formal
  approval/rollback, or external validation).

## Method

| Step | What is done | Why |
|---|---|---|
| Cohort | Encounters ending in death or hospice discharge (codes 11, 13, 14, 19, 20, 21) are excluded from training and evaluation | They cannot be readmitted; including them distorts the model |
| Split | Train / validation / test = 60 / 20 / 20, **grouped by `patient_nbr`** | Repeat patients would otherwise leak between train and test |
| Features | Strack et al. (2014) ICD-9 diagnosis groups, total prior visits, number of medication dose changes, active medications, age midpoint, HbA1c-tested and insulin-changed flags, plus the original demographic/clinical columns (`features.py`) | Shared by training, scoring, SHAP and the fairness audit so they cannot diverge |
| Candidates | Calibrated logistic regression, random forest, LightGBM | Interpretable baseline plus stronger models |
| Probabilities | `CalibratedClassifierCV` (no `class_weight`) | `class_weight` distorts `predict_proba`; calibration makes it mean what it says |
| Selection | Highest **validation** ROC-AUC (PR-AUC tie-break) | The test set is never used for choices |
| Thresholds | `max_f1` and `top_decile` chosen on **validation**; both reported on test, alongside the textbook 0.5 | A score becomes a decision only through a cutoff |
| Test set | Scored **once**, after every choice is frozen; 1,000-resample bootstrap 95% intervals | Honest uncertainty |

Real, current numbers live in `artifacts/readmission_risk_metrics.json` --
read that file rather than any figure quoted in documents, since it changes
when the model is retrained. Published work on this dataset typically reports
ROC-AUC in the mid-0.6s to about 0.70; limited signal in these administrative
fields, not a modelling defect, is the reason.

## Files

| File | Purpose | Output |
|---|---|---|
| `features.py` | Cohort rules, ICD-9 grouping, derived features, ID-mapping parser | (library) |
| `train_readmission_model.py` | Train, select, evaluate, choose thresholds | `readmission_risk_model.joblib`, `readmission_risk_metrics.json` |
| `apply_predictions.py` | Score every row into `hospital_readmissions` | columns `predicted_readmission_risk`, `..._model_version`, `..._in_scope` |
| `explain_model.py` | SHAP: global importance and per-encounter reasons | `readmission_risk_explanations.json`, table `readmission_risk_explanations` |
| `fairness_audit.py` | Per-subgroup AUC, recall, false-positive rate, calibration gap | `readmission_risk_fairness.json` |

`explain_model.py` explains the base (uncalibrated) model on the **log-odds**
scale. The `readmission_risk_explanations` table is not reachable by the
assistant (its SQL guard allows exactly one table) and is read only by the
`/predictive` page, which never sends `encounter_id` to the browser.

The fairness audit suppresses subgroups with fewer than 100 rows or fewer
than 10 cases of either outcome, reports Wilson intervals, and notes when a
gap's intervals overlap (possible sampling noise). It is a visibility tool,
not a fairness certification.

## Regeneration order

Run from the repository root. Each step reads what the previous one wrote.

```powershell
engine\venv\Scripts\python.exe -m engine.ml.train_readmission_model
engine\venv\Scripts\python.exe -m engine.ml.apply_predictions
engine\venv\Scripts\python.exe -m engine.ml.explain_model
engine\venv\Scripts\python.exe -m engine.ml.fairness_audit
engine\venv\Scripts\python.exe -m engine.analysis.hba1c_study
engine\venv\Scripts\python.exe -m engine.analysis.data_quality
```

The last two live in `engine/analysis/` and do not depend on the model.
Restart the engine afterwards so it picks up the new schema description
(`FULL_SCHEMA_PROMPT` in `engine/main.py`).

Optional dependencies for these scripts are in `engine/requirements-ml.txt`
(scikit-learn, pandas, LightGBM, SHAP, statsmodels, scipy). The core engine
does not import them at runtime.

## Known limitations

- Scores applied to the whole table include rows the model trained on, so
  they are optimistic for those rows. `predicted_readmission_risk_in_scope`
  marks the modelling cohort; the held-out metrics are the trustworthy
  measure of quality.
- Calibration uses cross-validation inside the training split (not
  patient-grouped folds); the calibration curve on the test set is the
  independent check.
- The data have no timestamps, so "first encounter" in the HbA1c study is
  the lowest `encounter_id` per patient, a documented proxy.
- 1999-2008 US data; practice patterns have changed since.

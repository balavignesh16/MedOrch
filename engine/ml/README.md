# Predictive readmission-risk model

A real, trained early-readmission-risk classifier, added as a demonstration
capability on top of the Phase 4 assistant. This is separate from the chat
assistant's LLM entirely: the model is trained and evaluated offline, and
its output is stored as two plain columns in `hospital_readmissions`
(`predicted_readmission_risk`, `predicted_readmission_risk_model_version`).
The assistant only ever reads those columns like any other data — it never
asks the LLM to "predict" anything, which would be exactly the kind of
fabrication the rest of this phase was built to prevent.

## What this is not

- **Not clinically validated.** Not approved for clinical decision-making,
  triage, or care planning of any kind.
- **Not a live prediction service.** Scores are computed once, offline, and
  stored. There is no real-time inference endpoint.
- **Not the full model-governance gate** ROADMAP.md describes for Phase 5
  (drift monitoring, formal approval/rollback, external calibration
  validation, full subgroup fairness review). What's implemented: real
  training data, a patient-grouped train/test split, held-out evaluation,
  cross-validated probability calibration, and basic subgroup ROC-AUC
  visibility. What's deferred: everything else in that list.

## What it actually does

Trains a classifier to predict `readmitted == '<30'` (readmission within 30
days) from the other columns in `hospital_readmissions` — the same table
the assistant already queries; no additional data source, no CSV dependency
at runtime.

- **Split**: `GroupShuffleSplit` by `patient_nbr`, not by row. This dataset
  has repeat patients with multiple encounters; splitting by row would leak
  a patient's other encounters into the training set and inflate apparent
  accuracy. Splitting by patient avoids that.
- **Candidates**: logistic regression and a random forest, both wrapped in
  `CalibratedClassifierCV` (cross-validated Platt/isotonic scaling) so
  `predict_proba` output means what it says — an earlier version without
  calibration produced risk scores clustered tightly around 0.5 regardless
  of actual risk, which would have misled anyone reading the number as a
  probability.
- **Selection**: whichever candidate has the higher held-out ROC-AUC.
- **Evaluation**: accuracy, precision, recall, F1, ROC-AUC, and Brier score
  (calibration quality), computed only on the held-out test split — never
  on training data — plus a basic subgroup ROC-AUC breakdown by race and
  gender for visibility.

Real, current numbers are in `artifacts/readmission_risk_metrics.json`
after training — read that file rather than trusting any number quoted
here, since it will drift as the model is retrained. As of this writing:
held-out ROC-AUC is approximately 0.66, consistent with published results
on this well-studied public dataset — early readmission is a genuinely
hard, modest-signal prediction problem, and this number should not be
expected to improve dramatically without materially better data (e.g. real
lab values, vitals, or social determinants not present in this dataset).

## Files

- `train_readmission_model.py` — trains, evaluates, and saves the model to
  `artifacts/readmission_risk_model.joblib` plus metrics to
  `artifacts/readmission_risk_metrics.json`.
- `apply_predictions.py` — loads the saved model, scores every row in
  `hospital_readmissions`, and writes the two new columns back via a
  writable connection. This is an offline data-preparation step run by a
  developer, never something the AI engine's read-only guarded SQL path
  does at request time.

## Re-running

```powershell
engine\venv\Scripts\python.exe -m engine.ml.train_readmission_model
engine\venv\Scripts\python.exe -m engine.ml.apply_predictions
```

Re-run both together after any change to the training data or feature
logic — `apply_predictions.py` always scores with whatever model is
currently saved to `artifacts/readmission_risk_model.joblib`.

## Known limitation: scores include training data

`apply_predictions.py` scores every encounter, including rows the selected
model was trained on. Held-out metrics in `readmission_risk_metrics.json`
are the trustworthy number for "how good is this model"; the risk score
displayed for any individual training-set encounter may be somewhat
optimistic relative to that held-out number.

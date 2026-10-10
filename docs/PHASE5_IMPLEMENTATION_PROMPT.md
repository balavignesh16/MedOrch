# MedOrch Phase 5: Analytics Rigour & "Wow Factor" Implementation Brief

You are implementing the next phase of **MedOrch**, a healthcare analytics platform built as a university project for a **Healthcare & Data Analytics** course. The goal of this phase is the work a healthcare-analytics professor grades highest: **methodological rigour, honest evaluation, interpretability, fairness, statistical inference, and a polished demo.** The engineering foundation (guarded SQL, an audit log, an evidence-grounded AI assistant) is already strong. The analytics layer is what's weak.

Read this whole brief before writing any code. Work **one milestone at a time**. At the end of each milestone, stop and report to the user (see "Reporting format" at the bottom) before starting the next one.

---

## 0. Ground rules (non-negotiable)

These rules come from how this project has been built so far. Breaking them is worse than leaving a feature unfinished.

1. **Never fabricate a number.** Every metric, chart value, p-value, or claim shown in the UI must be computed from the real data or real model artifacts. No placeholder values, no `Math.random()`, no "illustrative" numbers presented as real. If something can't be computed honestly, show an explicit "not available" state and say why.
2. **Verify, don't assume.** Don't report a feature as working until you have actually run it: the training script, the tests, the build, and the page in the running app. If you couldn't verify something, say so plainly.
3. **No tests may call an external LLM or the network.** Use the existing fake `LanguageModel` / `QueryPlanner` pattern in `engine/tests/test_main.py`. ML tests use small synthetic SQLite fixtures (see `engine/tests/test_ml_readmission_model.py`), never the full 100k-row database.
4. **Do not commit, push, or create branches** unless the user explicitly asks. The working tree already holds uncommitted work from previous sessions. Leave it intact and don't revert or reformat unrelated files.
5. **Don't touch** `diabetic_data.csv` at the repo root (the user chose not to commit it), the legacy synthetic tables (`patients`, `staff`, `compliance_logs`, `admissions`, `lab_results`, `medications`), or the gRPC proto contract, unless a milestone explicitly says to.
6. **The AI assistant's SQL path stays read-only and single-table** (`hospital_readmissions`). Any new derived data the UI needs is produced by **offline scripts** under `engine/ml/` or `engine/analysis/` (writable connection, run by a developer). It is never produced by the request-time engine. This mirrors the existing `engine/ml/apply_predictions.py`.
7. **Label honestly.** This is de-identified historical data (1999–2008, 130 US hospitals). The model is a demonstration, not clinically validated. Keep the existing disclaimers, and add them wherever a new prediction or scenario number appears.
8. Keep comments minimal: only explain a non-obvious *why*. No multi-paragraph docstrings.
9. Match existing code style and patterns. Read neighbouring files before adding new ones.

### Environment facts (Windows 11; Git Bash and PowerShell both available)
- Python venv: `engine/venv/Scripts/python.exe` (the system `python` has no pytest; always use the venv).
- Engine tests: `engine/venv/Scripts/python.exe -m pytest engine/tests -q` (currently **110 passing**).
- Frontend checks (run in `frontend/`): `npm run lint`, `npm run typecheck`, `npm test` (currently **70 passing**), `npm run build`.
- Retrain the model: `engine/venv/Scripts/python.exe -m engine.ml.train_readmission_model`, then re-score: `engine/venv/Scripts/python.exe -m engine.ml.apply_predictions`.
- Services: frontend `:3000` (Next.js 16, App Router), Go gateway `:50051`, Python engine `:50052`, Ollama `:11434`. To restart only the engine after Python changes, in PowerShell: `$enginePid = (Get-NetTCPConnection -LocalPort 50052 -State Listen).OwningProcess | Select-Object -Unique; taskkill /PID $enginePid /F; Start-Process cmd -ArgumentList '/k','venv\Scripts\python.exe main.py' -WorkingDirectory 'D:\helth\MedOrch\engine' -WindowStyle Minimized`. **Never name a PowerShell variable `$pid`**: it is a read-only automatic variable holding the shell's own process ID.
- CI (`.github/workflows/ci.yml`) installs `engine/requirements-dev.txt` + `engine/requirements-ml.txt` and runs `pytest engine`. New ML dependencies go in `requirements-ml.txt`, and ML tests must stay fast (seconds, not minutes). Guard optional imports with `pytest.importorskip`.
- Frontend stack: Next.js 16, React 19, Tailwind, `recharts` 3, `framer-motion`, `better-sqlite3` (read-only DB access; see `frontend/src/lib/databaseConfig.ts` and `frontend/src/app/actions/*Db.ts`), `vitest`. Dark theme with `brand-teal`, `surface-obsidian`, and `surface-black` tokens. Copy the visual style of `frontend/src/app/assistant/page.tsx`.
- **Note:** `frontend/CLAUDE.md` / `frontend/AGENTS.md` say this Next.js version may differ from what you know. Read the relevant guide in `frontend/node_modules/next/dist/docs/` before writing new route/page code.

### Verified facts about the data and the current model
- Database: `database/medorch.db`, table `hospital_readmissions`: **101,766 encounters**, **71,518 unique patients** (`patient_nbr`). This is the UCI "Diabetes 130-US hospitals for years 1999–2008" dataset.
- `readmitted` ∈ {`'NO'`, `'<30'`, `'>30'`}: 54,864 NO / 11,357 `<30` / 35,545 `>30`. The model target is `<30` (10.7% prevalence).
- The DB **excludes** `weight` (96.9% missing in the raw CSV), `payer_code` (39.6% missing), and `medical_specialty` (49.1% missing). The raw CSV with all 50 columns is at `engine/diabetes_data/dataset_diabetes/diabetic_data.csv`, and the code-label mapping is at `engine/diabetes_data/dataset_diabetes/IDs_mapping.csv`.
- `a1cresult` is NULL (test not performed) for **83.3%** of encounters.
- Discharge disposition codes (from `IDs_mapping.csv`): **11, 19, 20, 21 = Expired; 13, 14 = Hospice.** These patients cannot be readmitted, so including them distorts a readmission model.
- 23 medication columns are present, each with values `No` / `Steady` / `Up` / `Down`.
- Current model (`engine/ml/train_readmission_model.py`): logistic regression vs. random forest, both wrapped in `CalibratedClassifierCV`, with a patient-grouped split. **Held-out ROC-AUC 0.66, but recall 0.3% at the hard-coded 0.5 threshold** (it catches 7 of 2,151 test readmissions). The probabilities are calibrated; the problem is the threshold and the features. The code deliberately avoids `class_weight="balanced"` because it corrupts `predict_proba`. Keep that decision: fix the threshold instead of distorting the probabilities. Diagnoses are currently grouped by the first 3 characters of the ICD-9 code, which is crude.
- **Credibility problem:** `frontend/src/lib/ml/modelRegistry.ts` hardcodes a fake model card (`accuracy: 94.2`, `version: '1.4.2'`, invented owners and dates), and `frontend/src/app/predictive/page.tsx` displays it. Several components in `frontend/src/components/predictive/` (e.g. `demand-forecast.tsx`, `model-monitor.tsx`, `prediction-lifecycle.tsx`, `intervention-center.tsx`) and `frontend/src/app/actions/predictiveDb.ts` likely show values that don't come from the real model. A professor who sees "94.2% accuracy" next to a real 0.66 AUC will mark the project down for dishonesty. Milestone 5 fixes this.

---

## Milestone 1: A model that actually works, with proper evaluation

**Goal:** turn the model from "technically trained" into "defensibly evaluated", and lift recall from 0.3% to a meaningful level at an explicitly chosen operating threshold.

### 1.1 Cohort definition (methodology)
In `engine/ml/train_readmission_model.py`'s `load_dataset` (or a new helper it calls):
- **Exclude encounters whose discharge disposition is death or hospice** (`discharge_disposition_id` ∈ {11, 13, 14, 19, 20, 21}) from **training and evaluation**, because they cannot have a readmission outcome. Record the excluded count in the metrics JSON.
- Keep the patient-grouped split (`GroupShuffleSplit` by `patient_nbr`). Change it to a **three-way split, train / validation / test (≈ 60/20/20), all grouped by patient.** The validation split is used only for threshold selection and model selection. The test split is touched **once**, for final reporting. Write this down in the metrics JSON `split_method`.
- `apply_predictions.py` still scores **all** rows, including excluded ones, so the DB column stays complete. Add a column `predicted_readmission_risk_in_scope` (INTEGER 0/1) marking whether the row was in the modelling cohort. Update `FULL_SCHEMA_PROMPT` in `engine/main.py` to describe this new column accurately.

### 1.2 Feature engineering
Add these to the training pipeline; they are all derived from existing columns:
- **ICD-9 diagnosis groups** for `diag_1/2/3`, replacing the 3-character prefix. Use the standard grouping from Strack et al. (2014), the paper that published this dataset: *Circulatory* (390–459, 785), *Respiratory* (460–519, 786), *Digestive* (520–579, 787), *Diabetes* (250.xx), *Injury* (800–999), *Musculoskeletal* (710–739), *Genitourinary* (580–629, 788), *Neoplasms* (140–239), *Other* (everything else, including `V` and `E` codes), and *Missing*. Implement it as a pure, unit-tested function `icd9_group(code: str | None) -> str` in a new module `engine/ml/features.py`. Handle codes like `'250.83'`, `'V57'`, `'E909'`, `'?'`, None, and `'414'`.
- `total_prior_visits` = `number_outpatient + number_emergency + number_inpatient`.
- `num_med_changes` = count of the 23 medication columns whose value is `Up` or `Down`.
- `num_meds_active` = count of the 23 medication columns that are not `No`.
- `insulin_changed` (bool), `a1c_tested` (bool: `a1cresult` is not NULL), and `age_midpoint` (numeric from the bracket string, e.g. `[70-80)` → 75).
- Map `admission_type_id`, `discharge_disposition_id`, and `admission_source_id` through `IDs_mapping.csv` to readable labels where that helps the explainability output (Milestone 2). Keep them categorical.

All feature functions go in `engine/ml/features.py` and are shared by `train_readmission_model.py` and `apply_predictions.py`, so training and scoring can never diverge.

### 1.3 Candidate models
- Keep the calibrated logistic regression (it is the interpretable baseline the professor will expect).
- Replace or supplement the random forest with **gradient boosting**: add `lightgbm` to `engine/requirements-ml.txt` (not installed yet; install it into the venv). If it can't be installed on this machine, fall back to sklearn's `HistGradientBoostingClassifier` and say so in the report. Calibrate it the same way as the others.
- Choose the final model by **validation ROC-AUC**, with PR-AUC as a tie-breaker. Never use the test set for model selection.

### 1.4 Threshold selection
Compute and store **two operating thresholds**, both chosen on the **validation** set:
- `threshold_max_f1`: the threshold maximising F1.
- `threshold_top_decile`: the threshold that flags the top 10% highest-risk encounters (a realistic "care-management capacity" policy; hospitals can't follow up everyone).

Use `threshold_max_f1` as the default `operating_threshold`. Report precision, recall, specificity, F1, and the confusion matrix on the **test** set at **both** thresholds, plus at 0.5 for comparison (so the improvement over the old behaviour is visible and honest).

### 1.5 Evaluation artifacts (saved to `engine/ml/artifacts/readmission_risk_metrics.json`)
Extend the JSON. Keep all existing keys so nothing breaks, and add:
- `roc_auc`, `pr_auc` (average precision), `brier_score`, and **95% bootstrap confidence intervals** for ROC-AUC and PR-AUC (1,000 resamples of the test set; seed it).
- `roc_curve`: up to ~100 downsampled `{fpr, tpr, threshold}` points. `pr_curve`: same idea with `{recall, precision, threshold}`.
- `calibration_curve`: 10 quantile bins of `{mean_predicted, observed_rate, count}`.
- `threshold_analysis`: metrics at each of the three thresholds described above.
- `cohort`: total rows, excluded rows (by reason), and in-scope rows; train/validation/test sizes and positive rates.
- `feature_list`: the final engineered feature names.
- `literature_context`: a short honest note that published work on this dataset typically reports ROC-AUC in roughly the mid-0.6s to around 0.70 for 30-day readmission. **Phrase it as approximate context, not a citation of an exact figure**, so a weak-looking AUC is understood as a property of the data rather than a bug.
- Keep `known_limitations` and update it.

### 1.6 Tests (`engine/tests/test_ml_readmission_model.py` and a new `engine/tests/test_ml_features.py`)
- `icd9_group`: table-driven tests covering every category boundary, `V` and `E` codes, decimals, `'?'`, None, and empty strings.
- Engineered features: correct counts on a hand-built 3-row frame.
- Cohort exclusion: rows with disposition 11/13/14/19/20/21 are excluded from training.
- Patient-grouped split: no `patient_nbr` appears in more than one of train/validation/test.
- Threshold selection: on a synthetic dataset, `threshold_top_decile` flags ≈10% of validation rows.
- The metrics JSON contains every new key, and curve arrays are non-empty and monotonic where expected.
- Keep tests fast: synthetic fixtures of a few hundred rows.

### 1.7 Run it for real
Retrain on the real database, re-run `apply_predictions`, and restart the engine. Then report the **actual** numbers: test ROC-AUC with its CI, PR-AUC, and recall/precision at each threshold. If AUC barely moves, that is fine and expected for this dataset; say so honestly. The headline improvement is recall at a sensible threshold, plus the rigour of the evaluation.

**Acceptance:** all engine tests pass; the metrics JSON is regenerated with real values; recall at `operating_threshold` is far above 0.3%; the test set was used exactly once; the report states the real numbers.

---

## Milestone 2: Explainability (SHAP)

**Goal:** answer "why does the model think this?" both globally and for individual encounters.

- Add `shap` to `engine/requirements-ml.txt` and install it. Create `engine/ml/explain_model.py` (offline script, run after training):
  - **Global importance:** mean |SHAP value| per feature on a seeded sample (~2,000 rows) of the **test** set. Aggregate one-hot columns back to their **original feature** (e.g. all `diag_1_group_*` columns → `diag_1_group`) so the chart reads in human terms. Save the top 20 to `engine/ml/artifacts/readmission_risk_explanations.json` along with the direction of effect (mean SHAP for high vs. low feature values, or the logistic-regression coefficient sign if the LR model was selected).
  - **Local explanations:** for the 500 highest-risk in-scope encounters, compute their top 5 contributing features (feature, human-readable value, signed contribution). Store them in a **new SQLite table** `readmission_risk_explanations(encounter_id INTEGER, rank INTEGER, feature TEXT, feature_value TEXT, contribution REAL, model_version TEXT)`, created and populated by this offline script. The assistant's SQL authorizer must **not** be granted access to it. It is read only by the frontend through `better-sqlite3` server actions.
  - Use `shap.TreeExplainer` for tree models and `shap.LinearExplainer` (or the coefficients directly) for logistic regression. Explain the **uncalibrated base estimator's** output and say in the JSON that explanations are on the model's raw score scale (log-odds), not on calibrated probability.
- Tests: aggregation of one-hot SHAP columns back to their source features (pure function, synthetic input), and the shape of the explanations JSON and table using a tiny fixture model.
- **Acceptance:** the top global drivers are clinically plausible (prior inpatient visits, discharge disposition, number of diagnoses, and diagnosis group usually rank highly; report what you actually get, don't force it). The explanations table is populated for 500 encounters.

---

## Milestone 3: Fairness & subgroup audit

**Goal:** show that model performance was checked across demographic groups. Healthcare-AI ethics is a core course topic, and very few student projects do this properly.

- Create `engine/ml/fairness_audit.py` (offline). On the **test** set, for each of `race` (including NULL as "Unknown"), `gender` (drop `Unknown/Invalid` if n < 30 and say so), and **age band** (collapse to `<40`, `40–59`, `60–79`, `80+`), compute per group:
  - n, observed `<30` readmission prevalence, and mean predicted risk (a calibration-in-the-large gap);
  - ROC-AUC with a bootstrap 95% CI (skip and mark "insufficient data" if n < 100 or there are fewer than 10 positives);
  - recall (true-positive rate), false-positive rate, and precision at `operating_threshold`.
- Compute the gaps between the best and worst groups for **TPR (equal opportunity)** and **FPR**, and flag any gap > 0.10 in the output.
- Save the results to `engine/ml/artifacts/readmission_risk_fairness.json`, including a short plain-language `interpretation` per attribute that is **generated by deterministic rules from the numbers** (e.g. "Recall ranges from X (group A) to Y (group B); the gap of Z exceeds the 0.10 review threshold."), never by an LLM.
- Replace the existing `subgroup_roc_auc` in the metrics JSON with a pointer to this file (or keep both if that's simpler for backward compatibility).
- Tests: group collapsing, small-group suppression, gap computation, and the interpretation rules on synthetic numbers.
- **Acceptance:** the JSON is produced from real data; small groups are suppressed rather than reported with misleading precision; gaps are flagged.

---

## Milestone 4: Reproduce the published study (HbA1c and readmission)

**Goal:** replicate the core analysis of the paper that introduced this dataset: **Strack B, DeShazo JP, Gennings C, et al. "Impact of HbA1c Measurement on Hospital Readmission Rates: Analysis of 70,000 Clinical Database Patient Records." *BioMed Research International*, 2014.** Showing that your pipeline reproduces a peer-reviewed finding is the single most academically convincing thing this project can do.

- Add `statsmodels` to `engine/requirements-ml.txt` (scipy is already installed).
- Create `engine/analysis/__init__.py` and `engine/analysis/hba1c_study.py` (offline script, outputs `engine/analysis/artifacts/hba1c_study.json`).
- **Cohort (follow the paper's approach and document every step with its row count):** one encounter per patient (the **first** encounter, i.e. the lowest `encounter_id` per `patient_nbr`, as a documented proxy for chronological order since the data has no dates; state this assumption); exclude death/hospice dispositions; diabetic encounters only, where the dataset allows. Report a **CONSORT-style flow** of counts at each step.
- **Exposure groups** (from `a1cresult` and `change`): (1) HbA1c not measured; (2) measured, normal (`Norm` or `>7`); (3) measured `>8`, medication changed; (4) measured `>8`, no medication change.
- **Outcome:** `readmitted == '<30'`.
- **Analyses:**
  1. A readmission rate per exposure group with Wilson 95% CIs.
  2. A chi-square test of independence (exposure × outcome).
  3. **Multivariable logistic regression** (statsmodels `Logit`) of the outcome on exposure group, adjusting for age band, race, gender, admission source, discharge disposition (grouped), time in hospital, and primary-diagnosis group. Report **odds ratios with 95% CIs and p-values**, using "not measured" as the reference.
  4. An **interaction model**, exposure × primary-diagnosis group (the paper's key nuance is that the association depends on the primary diagnosis). Report the interaction terms' significance with a likelihood-ratio test.
- **Do not hardcode or invent the paper's numbers.** Write `paper_comparison` as a **qualitative** statement of the paper's headline finding (HbA1c measurement was associated with lower readmission rates, and the relationship depended on primary diagnosis), marked `"verify_against_paper": true`. Then state whether *our* results point in the same direction. If the user later supplies exact figures from the paper, they can be added.
- Tests: cohort steps on a synthetic frame (one row per patient, exclusions applied), exposure-group assignment for every `a1cresult`/`change` combination, Wilson CI against a known value, and a check that the OR output structure is well-formed (fit on a tiny synthetic dataset with a planted effect and assert OR > 1).
- **Acceptance:** the JSON contains the cohort flow, group rates with CIs, the chi-square result, an OR table, and the interaction test, all from real data, and the report summarises the findings honestly, including if they *don't* match the paper.

---

## Milestone 5: Rebuild the Predictive page on real artifacts

**Goal:** replace the fake model card and any fabricated predictive widgets with a page that displays the real evaluation from Milestones 1–3.

- **Audit first.** For every component in `frontend/src/components/predictive/` and every function in `frontend/src/app/actions/predictiveDb.ts`, determine whether its values come from the real DB/model or are hardcoded/derived from invented formulas. Put a table of your findings in the milestone report. **Remove** fabricated widgets. Keep a widget only if it can be wired to real data, and if one is kept as a concept it must have a visible "Demonstration – not real data" label. Delete the fake `readmission_v1` entry (and any other fake entries) from `frontend/src/lib/ml/modelRegistry.ts`, or delete the registry if nothing real uses it.
- Add a server-side loader, `frontend/src/lib/ml/modelArtifacts.ts`, that reads the three JSON artifacts from `engine/ml/artifacts/` (resolve paths like `databaseConfig.ts` does). Give it typed interfaces and graceful "artifact missing → show how to generate it" states. Unit-test the loader with fixture JSON.
- New or rebuilt page sections (recharts, existing dark theme):
  1. **Model card:** model type, version, trained-at, training cohort and exclusions, target definition, split method, intended use, **not-for-clinical-use** disclaimer, and limitations, all from the JSON.
  2. **Headline metrics:** ROC-AUC ± CI, PR-AUC ± CI, Brier score, and prevalence. Add a small note explaining PR-AUC versus the 10.7% baseline.
  3. **ROC curve** (with the diagonal reference line), **PR curve** (with a baseline at prevalence), and **calibration plot** (with the perfect-calibration diagonal).
  4. **Threshold explorer:** a toggle between `0.5` / `max-F1` / `top-10%` showing the confusion matrix and precision/recall/specificity at each, so the professor can see the trade-off. Use only the precomputed values; don't recompute in the browser.
  5. **Global SHAP importance** bar chart (top 15), with direction-of-effect colouring.
  6. **Fairness table:** per group n, prevalence, AUC (CI), TPR, FPR, and calibration gap, with flagged gaps highlighted, plus the deterministic interpretation text.
  7. **High-risk encounters list:** the top 50 by `predicted_readmission_risk` (in-scope only). Show de-identified attributes only; **never display `encounter_id` or `patient_nbr`**, so use the row's rank as the display key. Clicking a row expands its **top-5 SHAP contributions** from `readmission_risk_explanations`. This server action needs `encounter_id` internally to join, but must not send it to the client.
- Tests: the loader, any formatting helpers, and a check that the high-risk list payload sent to the client contains no `encounter_id` or `patient_nbr` keys.
- **Acceptance:** no fabricated numbers remain on `/predictive`; every value traces to an artifact or a DB query; lint, typecheck, tests, and build pass; you loaded the page in the running app and checked it renders, including the "artifact missing" state if you temporarily rename a file (rename it back afterwards).

---

## Milestone 6: Research page and statistical cohort comparison

**Goal:** a `/research` page presenting the HbA1c replication, plus an interactive tool for doing real inferential statistics on two cohorts.

- **HbA1c study section:** render `hba1c_study.json`: the CONSORT flow diagram (simple boxes and arrows), group rates with CI error bars, the OR forest plot (horizontal CIs with a reference line at OR = 1, log-scale x-axis), the interaction-test result, the qualitative paper comparison, and the citation.
- **Cohort comparison tool:**
  - The UI lets the user define cohort A and cohort B with the **existing allowlisted filters** (reuse `frontend/src/lib/analytics/filters.ts` / `validators.ts`; never build SQL from raw user strings), then pick an outcome: `<30` readmission (binary), or `time_in_hospital` / `num_medications` / `number_inpatient` (numeric).
  - A server action runs parameterised read-only queries via `better-sqlite3` and computes:
    - for a binary outcome: rates, difference with 95% CI, **chi-square test** (or Fisher's exact test if any expected cell < 5), **odds ratio with CI**, and **Cohen's h**;
    - for a numeric outcome: mean ± SD, median, **Welch's t-test**, **Mann–Whitney U** (because these counts are skewed), and **Cohen's d**.
  - Show a plain-English interpretation generated by deterministic rules (e.g. "statistically significant at α = 0.05, but the effect size is small"). Always add the caveat: **association, not causation; observational data.**
  - Warn when cohorts overlap and when either cohort has n < 30.
- **Statistics implementation:** add `jstat` (or another small, well-maintained distribution library) for the CDFs, and put the test functions in `frontend/src/lib/analytics/inference.ts`. **Validate every function against reference values precomputed with scipy:** write a one-off script that prints the scipy results for a few fixed inputs, then hardcode those expected values (with a comment naming scipy as the source) into `inference.test.ts`, with tolerances.
- **Acceptance:** inference functions match scipy to ~1e-6 (p-values to ~1e-4); the page renders the study and the comparison tool against the running app; all checks pass.

---

## Milestone 7: Data-quality page and medication analytics

**Goal:** demonstrate data-literacy maturity.

- **`/data-quality` page** (an offline script `engine/analysis/data_quality.py` writes `engine/analysis/artifacts/data_quality.json`, which the page reads):
  - Per-column missingness for **all 50 raw CSV columns** (from `engine/diabetes_data/dataset_diabetes/diabetic_data.csv`; note that `?` is the missing marker), with a bar chart. Explain why `weight`, `payer_code`, and `medical_specialty` were excluded from the DB.
  - Repeat-patient analysis: distribution of encounters per patient, and why this matters (data leakage, so the model splits by patient).
  - Outcome class balance, the `<30` vs. `>30` vs. `NO` split, and how "readmission" is defined in each part of the app (the assistant uses *any* readmission, `readmitted != 'NO'`; the model and the study use `<30`). Making this explicit prevents the definition confusion seen earlier in the project.
  - Cohort exclusions (death/hospice) with counts.
  - A **data lineage** diagram: CSV → `load_dataset.py` → `medorch.db` → offline ML/analysis scripts → artifacts → UI / assistant.
- **Medication analytics section** (on `/population` or a new tab): for each of the 23 drugs, prescription prevalence and the `No/Steady/Up/Down` breakdown; `<30` readmission rate by insulin status (No/Steady/Up/Down) with Wilson CIs; and readmission by count of medication changes. Suppress categories with n < 30. Use parameterised read-only queries.
- **Acceptance:** all numbers come from the real data; the missingness figures match the verified facts in section 0; the page and charts render in the running app.

---

## Milestone 8: AI-assistant "wow" features

**Goal:** a memorable live demo built on the existing safe, grounded assistant (`/assistant`, `engine/main.py`). Keep every existing safety property: the SQL guard, grounding verification, the PII guard, and the audit log.

1. **Automatic charts in assistant answers.** When a result has one categorical column plus one numeric column, render a bar chart beneath the table; for two numeric columns, a scatter plot; otherwise, table only. Choose the chart type **deterministically in the frontend from the result shape**, never by asking the LLM, and keep the table visible. Add a component test for the shape → chart-type rules.
2. **"Ask about this chart" buttons** on the dashboard and research charts. They open `/assistant` with a **pre-filled, editable** prompt describing the chart's metric and filters (e.g. "Compare 30-day readmission rates by HbA1c testing group"). They must not auto-send, and must not pass hidden instructions. Reuse the existing `?context=` query-param pattern and add a `?prompt=` param (validated, length-capped).
3. **Analysis report:** a `/report` page that assembles the model card, headline metrics, the fairness summary, the HbA1c study results, and the data-quality summary into a clean, **print-optimised** layout (`@media print` styles, page breaks, light theme when printing) with a "Download PDF" button that calls `window.print()`. This is the deliverable the user can hand in. Every number comes from the same artifacts.
4. **Intervention scenario calculator** (on `/predictive`): inputs for program capacity (top X% of in-scope encounters by model risk), assumed relative risk reduction of the intervention (default 0%; the user must enter it, e.g. from literature), and optional cost per readmission and per intervention (default blank). Output: number of encounters targeted, **real** count of actual `<30` readmissions among them (from the data, i.e. how many the model would have caught), and *scenario* readmissions averted = caught × assumed reduction. Label every derived number **"Scenario based on your assumptions – not a forecast"**, show the formula, and show nothing monetary unless costs are entered. Compute it server-side from the DB; unit-test the formula.

- **Acceptance:** the features work in the running app against the real engine (with a local Ollama model); all existing assistant tests still pass; new logic has tests; no feature lets the LLM produce an unverified number.

---

## Final milestone: Documentation & wrap-up

- Update `ROADMAP.md`: add a "Phase 5 – Analytics rigour (implemented)" section summarising what was built, and keep the honest-limitations tone of the existing document.
- Update `engine/ml/README.md` with the new cohort, features, evaluation, explainability, and fairness method, and with the **regeneration order**: `train_readmission_model` → `apply_predictions` → `explain_model` → `fairness_audit`, then `analysis/hba1c_study` and `analysis/data_quality`.
- Add a short "Demo script" section to the root `README.md`: a 5-minute walkthrough path for presenting to the professor (Data quality → Research/HbA1c → Predictive model card & fairness → Assistant with charts → Report PDF).
- Run **everything** one last time: engine tests, frontend lint/typecheck/tests/build, all offline scripts from a clean state, and a click-through of every new page in the running app.

---

## Reporting format (at the end of every milestone)

Stop and report to the user with:
1. **What was built:** the files created and modified (with paths).
2. **Real results:** the actual numbers produced (e.g. AUC with CI, recall at threshold, fairness gaps, ORs). Never write expected or illustrative numbers here.
3. **Verification performed:** the exact commands run and their pass counts, and which pages you opened in the running app.
4. **Honest caveats:** anything you couldn't verify, any dependency that failed to install and the fallback you used, and any result that looks weak or surprising, with an explanation.
5. **What's next:** the next milestone, and any decision you need from the user before starting it.

Do not proceed to the next milestone until the user says to. Do not commit unless asked.

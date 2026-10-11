# Viva preparation

Likely questions with short, honest answers. Figures are those of model version `readmission-risk-lightgbm-20261010T044120Z`; if you retrain, re-read `engine/ml/artifacts/readmission_risk_metrics.json` before quoting any number.

## The 60-second summary

I used the public UCI Diabetes 130-US Hospitals dataset (101,766 encounters, 71,518 patients) to predict 30-day readmission. The interesting part is not the score but the evaluation: a patient-grouped train/validation/test split, calibrated probabilities, thresholds chosen on validation data, a once-used test set with bootstrap confidence intervals, SHAP explanations, a fairness audit that separates real gaps from noise, and a replication-style HbA1c study. The model's ROC-AUC is 0.669, which is modest but typical for this kind of data. I also built an AI assistant that can only answer through a validated, read-only SQL pipeline, and every number it explains must cite a result cell.

## Numbers to know cold

| Item | Value |
|---|---|
| Encounters / patients | 101,766 / 71,518 |
| Readmitted <30 days / >30 days / never | 11.2% / 34.9% / 53.9% |
| Excluded (death or hospice) | 2,423 (1,652 + 771), leaving 99,343 |
| Split (encounters) | 59,814 train / 19,727 validation / 19,802 test, grouped by patient |
| Test ROC-AUC | 0.669 (95% CI 0.657–0.681) |
| Test PR-AUC | 0.232 (95% CI 0.218–0.249); chance is 0.112 |
| Brier score | 0.0945 |
| Recall / precision at 0.5 | 0.6% / 63.6% |
| Recall / precision at validation max-F1 (cutoff 0.142) | 43.8% / 21.1%, flags 23.3% |
| Recall / precision at top 10% (cutoff 0.173) | 24.8% / 26.5% |
| Weight missing / HbA1c not performed | 96.9% / 83.3% |
| HbA1c study | 69,987 patients; chi-square p = 0.020, Cramér's V = 0.012; adjusted ORs 0.87–0.95, none significant; interaction with diagnosis p = 0.007 |
| Assistant live test | 12 of 12 curated questions correct (local Qwen 2.5 14B) |
| Automated tests | 266 engine + 209 frontend |

## Data and design

**1. Why did you exclude death and hospice discharges?**
A patient who died or entered hospice cannot be readmitted, so including them would make the outcome artificially "no" for 2,423 encounters and distort both training and evaluation. They stay in the database but are flagged out of the modelling cohort.

**2. Why split by patient instead of randomly?**
16,773 of 71,518 patients have more than one encounter (one has 40). A random row split would put a patient's other encounters in the test set, and the model could memorise patient-specific patterns, inflating performance. Grouping by patient removes that leakage.

**3. Is any feature leaking the outcome?**
The outcome field itself is never a feature. All features are known by the time of discharge. Discharge disposition is legitimate because we predict readmission *after* discharge, but it means the model is a discharge-time tool, not an admission-time one.

**4. Why do you have two definitions of readmission?**
The source field has "<30" and ">30". The dashboards and assistant use "any readmission" (not "NO"), while the model and HbA1c study use "<30", the standard quality measure. I found the inconsistency when two differently worded assistant questions returned different totals, so now both are labelled everywhere and there is a definitions table on the Data Quality page.

**5. Why were weight, payer code and specialty dropped?**
They are missing for 96.9%, 39.6% and 49.1% of encounters. Imputing a column that is almost entirely missing would invent data.

**6. The data are from 1999–2008. Is that a problem?**
Yes, and it is listed as a limitation: coding and practice patterns have changed, and with no dates I cannot do temporal validation. The claim is about method, not about current hospitals.

## Modelling

**7. Why is the AUC only 0.67?**
Administrative fields (counts and codes) carry limited information about who returns; functional status, social support and follow-up care are absent. Systematic reviews report modest discrimination for most readmission models. My own comparison shows the ceiling: logistic regression 0.660, random forest 0.668 and LightGBM 0.671 on validation, so a much stronger model changed little. An AUC of 0.669 means a random readmitted encounter is ranked above a random non-readmitted one about two times in three.

**8. Accuracy was 89% at the default threshold. Why not report that?**
Because always predicting "not readmitted" scores 88.8% accuracy (1 − 0.112). Accuracy at 0.5 is 88.8%, no better than doing nothing; that is why I report recall, precision, PR-AUC against its 0.112 baseline, and calibration instead.

**9. Why didn't you use class weights or oversampling?**
Class weighting shifts the decision boundary but distorts the predicted probabilities; an early version produced scores bunched near 0.5. I keep probabilities honest through calibration and handle the imbalance by choosing the threshold explicitly on validation data.

**10. How did you choose the threshold, and could that overfit the test set?**
Two thresholds (maximum F1, and flagging the top 10%) were chosen on the validation set only. The test set was scored once afterwards and not used for any choice. That is why the test numbers can be trusted as an estimate of unseen-data performance.

**11. Why LightGBM if logistic regression is nearly as good?**
The selection rule (highest validation ROC-AUC, PR-AUC as tie-break) was fixed in advance and picked LightGBM, but the gain is small. I say so openly; logistic regression is easier to interpret, and I would accept that trade-off in practice.

**12. How well calibrated is it?**
The reliability curve on the test set follows the diagonal closely and the Brier score is 0.0945. A limitation: calibration used cross-validation inside the training split, which is not patient-grouped, so the held-out curve is the real check.

**13. What does SHAP show, and what doesn't it show?**
It shows how much each feature moved this model's score (prior inpatient visits and discharge disposition dominate; more prior visits, longer stays, more diagnoses and medications raise risk). It does not show causes: it describes the model, and correlated features share credit. I summed one-hot columns back to their original feature so the chart is readable.

**14. The risk scores in the database include training rows. Is that a problem?**
Those scores are optimistic for the rows the model trained on, which is why the Predictive page shows held-out figures and the scenario calculator says its capture rate is optimistic. A column marks which encounters were in the modelling cohort.

## Fairness and statistics

**15. Your fairness audit flags a big race gap. Is the model biased?**
Recall ranges from 0.21 (Unknown) to 0.60 (Asian), a gap of 0.39. But the Asian group has only 122 test encounters and 10 readmissions, so its interval is very wide and overlaps the others; I label that gap as possibly sampling noise. The age gaps are better supported because their intervals do not overlap. Differences can also reflect different base rates or access to care. The audit is a visibility tool, not a certification.

**16. Why Wilson intervals instead of the normal approximation?**
The Wald interval behaves badly for small samples and proportions near 0 or 1, exactly the situation in small subgroups. Wilson intervals have better coverage there.

**17. Your HbA1c result doesn't match the published paper. Did you fail to replicate it?**
The direction agrees (all three adjusted odds ratios are below 1, and the effect depends on diagnosis, p = 0.007), but none of the three is individually significant. This is a replication-style analysis: my cohort rules, adjustment set and one-encounter-per-patient choice differ from the paper's, and I did not compare its exact figures. HbA1c testing is also clinically selected, so I make no causal claim.

**18. The chi-square is significant (p = 0.020) but no odds ratio is. Contradiction?**
No. The chi-square tests all four groups together without adjustment; each odds ratio compares one group with "not measured" after adjusting for covariates, each with its own interval. The overall association is real but tiny (Cramér's V = 0.012).

**19. Why one encounter per patient, and how did you pick it?**
To keep observations independent. With no dates, I take the lowest encounter ID per patient as a proxy for the first. That is a documented limitation.

**20. You implemented the statistical tests yourself. Why should I trust them?**
Each function (chi-square, Fisher, Welch, Mann–Whitney, incomplete beta and gamma) is tested against SciPy reference values to a relative tolerance of 1e-5 or better, including edge cases such as tied ranks and tiny expected counts.

## The assistant and engineering

**21. How do you stop the language model inventing numbers?**
Four layers. A structured planner returns JSON, not prose. A SQL guard and a database authorizer independently allow only one read-only SELECT on one table. The database connection is read-only with limits. Any explanation must cite result cells for every number, which is checked; if it fails, the exact table is shown. Identifier patterns are scanned before output, and every request is audited by hash.

**22. Twelve questions is a small test.**
Agreed. It is a curated set used to make the demo reliable, not a benchmark. It did find three real defects that unit tests missed (an unsupported SQL construct, an over-strict rounding check, and a prompt change that made comparison questions return one row), and each is fixed and tested. A proper evaluation would use a larger, independently written question set and more than one model.

**23. What happens if someone tries a prompt injection or asks for patient identifiers?**
Adversarial cases are in the test suite: injected SQL, attempts to select identifier columns, and unrelated requests. The guard rejects them before anything runs, and identifier columns can appear only inside COUNT().

**24. Why a local model?**
Privacy and cost: prompts and results stay on the machine. The trade-off is speed (multi-row answers take 60–100 s on my hardware). A hosted model can be selected in the interface, with the caveat that data leave the machine.

**25. Is the login secure?**
It is real but demonstration-grade: server-side sessions in signed HttpOnly cookies, scrypt-hashed passwords, a login rate limiter, and role checks in both the proxy and the API handlers; the audit log records who asked. It has no SSO, MFA or account management, so a real deployment would use the hospital identity provider.

## Reflection

**26. What is the weakest part of the project?**
No external or temporal validation (the data are undated and from one source), modest predictive signal, small subgroups limiting fairness conclusions, and stored scores that include training rows.

**27. What would you do with more time?**
Temporal or external validation if dated data were available; richer features (labs, social determinants); subgroup-specific calibration; drift monitoring and a model-governance process; a larger independent assistant evaluation; SSO/MFA and account management.

**28. Could this be used in a hospital?**
Not as it is. It would need clinical validation on local data, recalibration, a governance process, human oversight of any care decision, and real security. It is a teaching demonstration.

**29. What did you learn that you didn't expect?**
That the threshold mattered more than the model: the same model catches 0.6% of readmissions at 0.5 and 43.8% at a validation-chosen cutoff. And that live testing finds defects that unit tests do not.

## If you are asked something you don't know

Say what you do know, then say how you would find out: "I haven't tested that. I would check X in the saved artifacts / run Y." Everything in the application traces to a saved artifact, so you can always point to where a number comes from (the Analysis Report page lists the main ones).

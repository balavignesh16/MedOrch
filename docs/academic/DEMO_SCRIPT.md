# 10-minute presentation script

Run the app at http://localhost:3100 (port 3000 is blocked on the demo laptop by a Windows port-forward). Sign in as `admin` first (password in `database/demo_credentials.txt`). Run `scripts\warmup.ps1` before you start.

| Time | Say / show | Key point |
|---|---|---|
| 0:00–1:00 | **Problem.** Hospitals want to know who is likely to return within 30 days. Slide 1–2. | Dataset: UCI Diabetes 130-US Hospitals, 101,766 encounters, 71,518 patients. |
| 1:00–2:30 | **Data and honesty.** Show Data Quality page. | Weight is 96.9% missing and was dropped; 2,423 death/hospice encounters excluded; two readmission definitions are labelled. |
| 2:30–4:30 | **Model and validation.** Slides on split, metrics, calibration. Show Predictive page. | Patient-grouped split, thresholds chosen on validation, test used once. AUC 0.669 (CI 0.657–0.681), modest and typical. At 0.5 the model flags almost nothing (recall 0.6%); the validation-chosen cutoff catches 43.8%. |
| 4:30–5:30 | **Fairness and the HbA1c study.** Research page. | Large race gap is probably small-sample noise (Asian: 10 readmissions); age gaps are better supported. HbA1c: chi-square p = 0.020 but tiny effect (V = 0.012). |
| 5:30–8:00 | **Live assistant.** Ask 2 questions while talking (each takes 15–90 s): "How many encounters resulted in a readmission within 30 days?" then "What is the 30-day readmission rate by age bracket?" | The assistant can only run one validated read-only SELECT; numbers must cite result cells; every request is audited. Mention it found three real bugs during live testing. |
| 8:00–9:00 | **Access control.** Sign out, sign in as `doctor`, open /financial and show the "Access restricted" page. | Roles enforced in the proxy and in API handlers; audit records `username:role`. |
| 9:00–10:00 | **Limits and close.** Slides: limitations, conclusions. | No temporal or external validation, modest signal, demo-grade login. Not for clinical use as it stands. |

## If something breaks
- Assistant slow or stuck: say "local 14B model, runs on this laptop so data never leaves it", and switch to the screenshots in `tmp/smoke/` (`assistant.png`) or the cloud Gemini button if configured.
- App will not load: show `docs/academic/MedOrch_Report.pdf` and the slides.
- Never improvise a question; use only those in `config/demo_questions.json`.

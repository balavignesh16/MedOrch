# Metric Catalog

The bundled database is de-identified demonstration data. These metrics are not suitable for clinical decisions or regulatory reporting.

| Display name | Internal identifier | Definition and formula | Source | Eligibility and invalid data | Filters | Classification and limitations |
|---|---|---|---|---|---|---|
| Total encounters | `totalEncounters` | Count of eligible, unique encounter records. | `hospital_readmissions.encounter_id` | A positive integer encounter ID must occur exactly once. Null, nonnumeric, nonpositive, and duplicated IDs are excluded. Empty cohorts return 0. | Demographic and clinical filters supported by the shared filter builder. `readmitted` is intentionally ignored for the core metric set. | Observed. This is not a unique-patient count. |
| <30-day readmission proxy rate | `readmissionProxyRate` | 100 × encounters categorized `<30` / encounters categorized `<30`, `>30`, or `NO`. | `hospital_readmissions.encounter_id`, `readmitted` | Uses only eligible unique encounters. Null, blank, and unknown outcomes are excluded from numerator and denominator. A zero denominator returns 0. | The same filters apply to numerator and denominator. `readmitted` is ignored because conditioning on the outcome would create a misleading 0% or 100% rate. | Proxy derived from the source category. No dates exist to verify timing, planned admissions, transfers, or same-day returns. |
| Average length of stay | `avgLengthOfStay` | Arithmetic mean of valid encounter-level LOS values. | `hospital_readmissions.encounter_id`, `time_in_hospital` | Uses only eligible unique encounters and numeric LOS values from 1–14 days. Null, nonnumeric, zero, negative, and out-of-range values are excluded. No valid values returns unavailable, not zero. | Same filters as total encounters; `readmitted` is ignored for the shared core set. | Derived. The 1–14 boundary is the documented range of the bundled source dataset. |

## Compatibility note

Some internal properties still use the legacy names `totalPatients` and `total_patients` for compatibility. In the population and quality summaries, disease table, cohort explorer, risk summary, and readmission analysis, these values count encounter rows rather than distinct people. Visible labels use "encounters". Internal renaming is deferred until all consumers can migrate together.

## Population dashboard

| Display name | Formula and source | Classification | Important limitations |
|---|---|---|---|
| Population Health Index | Configured score reduced by encounter-level high-risk percentage, readmission category percentage, mean LOS, mean medications, and mean emergency visits. | Heuristic | Not clinically validated; despite the legacy name, its inputs describe encounters rather than a distinct-patient population. |
| High Risk Encounters | Encounters where LOS > 5, emergency visits > 0, or medications > 15, divided by filtered encounter count. | Heuristic | Rule-based; does not represent validated patient risk. |
| Average Medications / Encounter | `AVG(num_medications)` over filtered encounter rows. | Derived | Medication counts are encounter fields, not a longitudinal medication list. |
| Average Age | Weighted mean of the midpoint of each valid `age` bucket. | Derived estimate | Age is bucketed; invalid buckets are excluded from the denominator. |
| Diabetes-medication percentage | Encounters where `diabetesmed = 'Yes'` divided by filtered encounters. | Derived | Indicates a recorded diabetes medication flag, not diabetes prevalence. |
| Diagnosis encounter count | Encounter rows grouped by nonblank `diag_1`. | Observed | Diagnosis codes are displayed as source codes and are not unique-patient counts. |
| Diagnosis readmission percentage | Rows with any non-`NO` category divided by diagnosis encounter count. | Legacy proxy | This differs from the supported `<30` proxy and is scheduled for correction in the filter/definition batch. |
| Risk distribution | Encounter rows assigned Critical/High/Medium/Low using LOS, emergency-visit, and medication thresholds. | Heuristic | Categories are demonstration rules, not validated clinical predictions. |

## Quality dashboard

| Display name | Formula and source | Classification | Important limitations |
|---|---|---|---|
| Quality Score | Configured score reduced by readmission proxy rate, LOS, medications, emergency visits, and high-risk percentage. | Heuristic | Not a regulatory, CMS, or validated clinical quality score. |
| High Risk Encounters | Encounters where `<30`, LOS >= 8, or medications >= 20, divided by total eligible encounters. | Heuristic | Uses a different rule from the population risk metric. Threshold alignment is deferred. |
| Average Emergency Visits | `AVG(number_emergency)` over filtered encounter rows. | Derived | Historical count attached to an encounter; not a live visit rate. |
| Average Procedures | `AVG(num_procedures)` over filtered encounter rows. | Derived | Mean recorded procedures per encounter. |
| Average Medications | `AVG(num_medications)` over filtered encounter rows. | Derived | Mean medication count per encounter. |
| Improvement Score | Fixed value currently returned by the quality overview. | Synthetic/demo | Not derived from source data; must not be interpreted as measured improvement. |
| Readmission breakdowns | Encounter counts and `<30` category counts grouped by diagnosis or demographic/source categories. | Observed counts plus proxy | Unknown categories may be displayed; dates are unavailable. |
| LOS diagnosis/disposition counts | Encounter rows grouped by diagnosis or discharge disposition, with LOS aggregates from `time_in_hospital`. | Observed counts plus derived LOS | Counts are encounters, not distinct patients. Detailed LOS validation alignment is deferred. |
| Medication diagnosis counts | Encounter rows grouped by diagnosis with medication aggregates from `num_medications`. | Observed counts plus derived averages | Counts and averages describe encounters, not longitudinal patient medication use. |
| Visit-frequency distribution | Encounter rows grouped by the sum of recorded emergency, inpatient, and outpatient visit fields. | Derived | The displayed count is encounters. Recorded visit fields may describe utilization preceding the encounter. |
| Insight affected count | Encounter count supplied to a rule-generated quality insight. | Heuristic | The internal compatibility property remains `affectedPatients`; the displayed value is correctly labelled encounters. |

## Terminology status

Sprint 2 Batch 2 corrected visible encounter-row labels across the population summary, cohort explorer, disease and risk views, quality KPIs, readmission proxy analysis, LOS and medication tables, utilization distribution, insights, and empty states. True patient-level profile and cohort tables continue to use patient terminology because they group by `patient_nbr`.

## Supported filter contract

All filter values are SQL parameters. Supported free-text/category filters are `gender`, `age`, `race`, `admission_type_id`, `discharge_disposition_id`, and `diag_1`. Supported enumerations are `readmitted` (`<30`, `>30`, `NO`), `riskLevel` (`Critical`, `High`, `Medium`, `Low`), `los` (`0-3`, `4-7`, `8+`), and `medCount` (`0-10`, `11-20`, `20+`). Blank, unknown, and invalid values are removed during normalization.

The schema has no date, department, or facility columns. Therefore `time_period`, `timeframe`, `cohort`, `department`, and `facility` are unsupported and ignored rather than being presented as effective SQL filters. The shared core metric set also intentionally ignores `readmitted`, because conditioning a readmission rate on its own outcome would produce a misleading 0% or 100% result. LOS boundaries are inclusive at 3 and 7; `8+` means greater than 7. Medication boundaries are inclusive at 10 and 20; `20+` retains its legacy meaning of greater than 20.

## Estimated financial model

Financial values are synthetic estimates in illustrative dollar-denominated relative cost units, not actual charges, payments, reimbursements, or accounting records. Model `demo-v1` uses one centrally configured formula: base encounter 100; LOS 25/day; medication 3/unit; laboratory procedure 5/test; clinical procedure 20/procedure; emergency visit 30; inpatient visit 40; outpatient visit 5; and `<30` readmission proxy 50/event. Dashboard totals, cohort estimates, distributions, and resource cards consume these same configured weights. Precision and thresholds are demonstration aids and must not be used for budgeting or financial decisions.

## Operational estimates

The bundled schema has no event timestamps, staffed-bed feed, queues, departments, schedules, or capacity measurements. Estimated daily encounter volume assumes the filtered dataset represents 30 days. Estimated bed occupancy starts at 70% and adds two percentage points per mean LOS day. Resource efficiency (85%), workflow efficiency (88%), patient-flow ratios, queue sizes, stage times, capacity, bottlenecks, trends, and departmental status are synthetic demonstration scenarios. Recorded emergency, inpatient, and outpatient values are historical count fields divided by eligible encounters; they are not current operational load. These values must not be used for staffing, capacity, or care-delivery decisions.

## Encounter-risk heuristic

One mutually exclusive encounter-level rule now powers population distribution, quality distribution, high-risk percentages, and the `riskLevel` filter. Critical means LOS > 7, emergency visits > 2, or medications > 20. High means the encounter is not Critical and LOS > 5, emergency visits > 0, or medications > 15. Medium means it is neither Critical nor High and LOS > 3 or medications > 10. All remaining encounters are Low. This is an unvalidated utilization heuristic, not a prediction, diagnosis, triage rule, or patient-level clinical risk assessment. Diagnosis-level concern ratings and patient-profile summaries use different aggregation contexts and must not be compared as the same metric.

## Sprint 2 audit result

Primary population, quality, financial, and operational metrics are now classified and their source limitations are visible. No supported chart uses encounter identifiers as dates. Readmission remains a source-category proxy; cost values are synthetic estimates; risk and score outputs are heuristics; and operational capacity/flow values are demo scenarios. Predictive, administration, and strategy modules remain demonstration modules scheduled for later replacement and are not validated analytics products.

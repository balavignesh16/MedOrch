// Builds MedOrch_Report.docx. Every number in the text is read from the saved analysis artifacts.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, ImageRun, LevelFormat, Packer,
  PageBreak, PageNumber, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const load = (...parts) => JSON.parse(readFileSync(path.join(root, ...parts), 'utf-8'));
const metrics = load('engine', 'ml', 'artifacts', 'readmission_risk_metrics.json');
const explain = load('engine', 'ml', 'artifacts', 'readmission_risk_explanations.json');
const fairness = load('engine', 'ml', 'artifacts', 'readmission_risk_fairness.json');
const study = load('engine', 'analysis', 'artifacts', 'hba1c_study.json');
const quality = load('engine', 'analysis', 'artifacts', 'data_quality.json');

const n = (value) => value.toLocaleString('en-US');
const pct = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`;
const f3 = (value) => value.toFixed(3);
const pval = (value) => (value < 0.001 ? '< 0.001' : value.toFixed(3));

const cohort = metrics.cohort;
const th = metrics.threshold_analysis;
const miss = Object.fromEntries(quality.missingness.map((row) => [row.column, row]));
const outcome = quality.outcome_balance.classes;
const repeat = quality.repeat_patients;
const rates = Object.fromEntries(study.group_rates.map((row) => [row.exposure, row]));
const ors = Object.fromEntries(study.adjusted_model.exposure_odds_ratios.map((row) => [row.term, row]));
const race = fairness.attributes.race;
const ageBand = fairness.attributes.age_band;
const gender = fairness.attributes.gender;

// ---------- layout helpers ----------
const FONT = 'Calibri';
const HEAD_FONT = 'Cambria';
const NAVY = '0B3C49';
const TEAL = '0F766E';
const GREY = '6B7280';
const CONTENT_WIDTH = 9360; // US Letter, 1-inch margins, in DXA

function runs(text, base = {}) {
  return text.split('**').map((part, index) => new TextRun({ text: part, bold: index % 2 === 1 ? true : base.bold, italics: base.italics, size: base.size, color: base.color }));
}

const p = (text, options = {}) =>
  new Paragraph({
    children: runs(text, options),
    spacing: { after: options.after ?? 120, line: 276 },
    alignment: options.align ?? AlignmentType.LEFT,
    keepNext: options.keepNext,
  });

const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)], keepNext: true });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)], keepNext: true });
const bullet = (text) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: runs(text), spacing: { after: 60, line: 276 } });

function pngSize(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

let figureCounter = 0;
let tableCounter = 0;
const caption = (kind, text) =>
  new Paragraph({
    children: [new TextRun({ text: `${kind} ${kind === 'Figure' ? ++figureCounter : ++tableCounter}. `, bold: true, size: 19, color: NAVY }), new TextRun({ text, italics: true, size: 19, color: '374151' })],
    spacing: { before: 60, after: 200 },
    alignment: AlignmentType.LEFT,
    keepNext: kind === 'Table',
  });

function image(file, widthPx) {
  const data = readFileSync(path.join(here, 'figures', file));
  const size = pngSize(data);
  return new ImageRun({ type: 'png', data, transformation: { width: widthPx, height: Math.round((widthPx * size.height) / size.width) } });
}
const figure = (file, widthPx, text) => [
  new Paragraph({ children: [image(file, widthPx)], alignment: AlignmentType.CENTER, spacing: { before: 120, after: 40 }, keepNext: true }),
  caption('Figure', text),
];

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const sideBySide = (left, right, text) => {
  const cell = (file) =>
    new TableCell({
      width: { size: CONTENT_WIDTH / 2, type: WidthType.DXA },
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
      children: [new Paragraph({ children: [image(file, 296)], alignment: AlignmentType.CENTER })],
    });
  return [
    new Table({ width: { size: CONTENT_WIDTH, type: WidthType.DXA }, columnWidths: [CONTENT_WIDTH / 2, CONTENT_WIDTH / 2], rows: [new TableRow({ children: [cell(left), cell(right)] })] }),
    caption('Figure', text),
  ];
};

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' };
function table(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (text, index, header) =>
    new TableCell({
      width: { size: widths[index], type: WidthType.DXA },
      borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
      shading: header ? { type: ShadingType.CLEAR, fill: 'E6F2F1', color: 'auto' } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ children: [new TextRun({ text: String(text), bold: header, size: 19 })], alignment: index === 0 ? AlignmentType.LEFT : AlignmentType.LEFT })],
    });
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((text, i) => cell(text, i, true)) }),
      ...rows.map((row) => new TableRow({ cantSplit: true, children: row.map((text, i) => cell(text, i, false)) })),
    ],
  });
}

const spacer = () => new Paragraph({ children: [], spacing: { after: 120 } });

// ---------- content ----------
const top = (feature) => explain.global_importance.find((entry) => entry.feature === feature);

const children = [];

// Title page
children.push(
  new Paragraph({ children: [], spacing: { before: 1800 } }),
  new Paragraph({ children: [new TextRun({ text: 'HEALTHCARE & DATA ANALYTICS · PROJECT REPORT', size: 22, color: TEAL, bold: true })], spacing: { after: 240 } }),
  new Paragraph({
    children: [new TextRun({ text: 'Predicting and Understanding 30-Day Hospital Readmission in Diabetes', font: HEAD_FONT, size: 60, bold: true, color: NAVY })],
    spacing: { after: 240, line: 300 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'A reproducible, fairness-audited analytics platform with a safety-checked AI assistant', font: HEAD_FONT, size: 30, color: '374151', italics: true })],
    spacing: { after: 1200 },
  }),
  new Paragraph({ children: [new TextRun({ text: 'Author: [your name]', size: 24 })], spacing: { after: 80 } }),
  new Paragraph({ children: [new TextRun({ text: 'Student ID / course / instructor: [fill in]', size: 24 })], spacing: { after: 80 } }),
  new Paragraph({ children: [new TextRun({ text: 'October 2026', size: 24 })], spacing: { after: 1200 } }),
  new Paragraph({
    children: [new TextRun({ text: 'All results in this report were generated from the project code and saved artifacts in the accompanying repository (MedOrch); none was entered by hand. The data are historical and de-identified. This is a teaching project, not a clinical tool.', size: 20, color: GREY, italics: true })],
    border: { top: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB', space: 8 } },
  }),
  new Paragraph({ children: [new PageBreak()] }),
);

// Abstract
children.push(
  h1('Abstract'),
  p(
    `Hospital readmission within 30 days is a widely used quality measure and a hard prediction problem. Using the public UCI Diabetes 130-US Hospitals dataset (${n(cohort.total_rows)} encounters, ${n(repeat.patients)} patients, 1999–2008), this project builds and evaluates a readmission-risk model with a deliberately rigorous methodology: death and hospice discharges are excluded from the modelling cohort, data are split into train, validation and test sets grouped by patient, probabilities are calibrated, decision thresholds are chosen on validation data only, and the test set is scored once with bootstrap confidence intervals.`,
  ),
  p(
    `The selected gradient-boosting model reaches a held-out ROC-AUC of **${f3(metrics.roc_auc)}** (95% CI ${f3(metrics.roc_auc_ci95[0])}–${f3(metrics.roc_auc_ci95[1])}), a modest discrimination consistent with the literature. The more instructive result is the decision threshold: the conventional cutoff of 0.5 catches ${pct(th['default_0.5'].recall)} of readmissions, whereas a validation-chosen cutoff catches ${pct(th.max_f1.recall)}. SHAP explanations identify prior inpatient visits and discharge disposition as the dominant drivers; a subgroup audit finds recall differences that are partly attributable to small samples; and a replication-style analysis of HbA1c testing finds directionally lower readmission without individually significant effects (${n(study.adjusted_model.n)} patients).`,
  ),
  p(
    'The work is delivered as a web platform whose every figure traces to saved artifacts, and whose natural-language assistant answers only through a validated, read-only SQL pipeline with evidence-checked narratives. Live testing of twelve curated questions on a local 14-billion-parameter model gave twelve correct answers.',
  ),
);

// 1 Introduction
children.push(
  h1('1. Introduction'),
  p('Unplanned readmission shortly after discharge is costly for patients and hospitals, and many health systems track the 30-day readmission rate as a quality indicator. Predictive models for readmission have been studied extensively, but systematic reviews report that most achieve only modest discrimination (Kansagara et al., 2011). Rather than chase a higher score, this project asks a different question: **how can a modest model be built, evaluated and presented so that its strengths, weaknesses and fairness are visible and honest?**'),
  p('The objectives were:'),
  bullet('**O1 – Data understanding:** profile the dataset, quantify missingness, define outcomes unambiguously, and trace every number back to the source file.'),
  bullet('**O2 – Rigorous prediction:** build a 30-day readmission model with leakage-safe evaluation, calibrated probabilities and explicitly chosen thresholds.'),
  bullet('**O3 – Interpretability and fairness:** explain what drives the model and audit its behaviour across demographic subgroups.'),
  bullet('**O4 – Statistical inference:** replicate the question of a published study (HbA1c measurement and readmission) and provide tools for testing differences between cohorts.'),
  bullet('**O5 – Safe AI access:** let a user query the data in plain English without allowing the language model to invent results.'),
  p('The contributions are the methodology and its documentation, the audited results, and an application in which dashboards, research pages, a printable report and an AI assistant all draw from the same verified sources.'),
);

// 2 Data
children.push(
  h1('2. Data'),
  p(`The data are the “Diabetes 130-US hospitals for years 1999–2008” dataset from the UCI Machine Learning Repository, introduced by Strack et al. (2014). Each of the ${n(cohort.total_rows)} rows is one hospital encounter of a diabetic patient, described by 50 attributes: demographics, admission and discharge information, length of stay, counts of laboratory tests, procedures and medications, up to three diagnosis codes, glucose and HbA1c test results, 23 diabetes medication fields, and the outcome field “readmitted”. The ${n(repeat.patients)} patients contribute between one and ${repeat.max_encounters_for_one_patient} encounters each.`),
  h2('2.1 Outcomes and definitions'),
  p(`The outcome field has three values: not readmitted (${n(outcome.NO.count)}, ${outcome.NO.percent}%), readmitted within 30 days (${n(outcome['<30'].count)}, ${outcome['<30'].percent}%) and readmitted after 30 days (${n(outcome['>30'].count)}, ${outcome['>30'].percent}%). Two definitions of “readmission” are used and are labelled wherever they appear: **any readmission** (a value other than “NO”), used by the descriptive dashboards and the assistant, and **30-day readmission** (“<30”), used by the prediction model and the HbA1c study. Stating this explicitly resolved an inconsistency discovered during development, when two differently worded assistant questions silently used different definitions and returned different totals.`),
  h2('2.2 Data quality'),
  ...figure('fig_missing.png', 470, `Missing data by column in the raw file. “?” is the missing marker; “not performed” means the test was not ordered, which is information rather than missingness.`),
  p(`Three columns are too sparse to use: weight is missing for ${miss.weight.missing_percent.toFixed(1)}% of encounters, medical specialty for ${miss.medical_specialty.missing_percent.toFixed(1)}% and payer code for ${miss.payer_code.missing_percent.toFixed(1)}%; they were excluded when the database was built. The HbA1c test was not performed for ${miss.A1Cresult.not_performed_percent.toFixed(1)}% of encounters and the glucose serum test for ${miss.max_glu_serum.not_performed_percent.toFixed(1)}%, which limits any analysis that depends on them. Race is missing for ${miss.race.missing_percent.toFixed(1)}% and is kept as an explicit “Unknown” group.`),
  p(`Two structural features of the data shape the methods. First, ${n(repeat.patients_with_multiple_encounters)} of ${n(repeat.patients)} patients have more than one encounter, so encounters are correlated and a random row-level split would leak a patient’s other encounters into the test set. Second, the file contains no dates, so temporal validation and trend analysis are impossible, and “first encounter” can only be approximated by the lowest encounter identifier.`),
  h2('2.3 Cohort for modelling'),
  p(`Encounters that ended in death or hospice discharge (${n(cohort.excluded_rows.expired)} expired and ${n(cohort.excluded_rows.hospice)} hospice, ${n(cohort.excluded_rows.total)} in total) cannot be followed by a readmission, so including them would distort both training and evaluation. They are excluded from the modelling cohort, leaving ${n(cohort.in_scope_rows)} encounters.`),
);

// 3 System
children.push(
  h1('3. System design'),
  p('The platform separates work that writes from work that only reads. Scripts run by a developer (cleaning, model training, SHAP, fairness audit, HbA1c study, data-quality profile) write JSON artifacts and scored columns. At runtime a web application and an analytics engine read the database and the artifacts but never modify them (Figure 2). Because every page loads its content from these artifacts, a missing artifact produces an explicit “needs to be generated” notice rather than a placeholder number, and an automated check fails if invented values reappear.'),
  ...figure('fig_architecture.png', 520, 'System architecture. Offline scripts produce the artifacts; the runtime services only read them.'),
  p('The natural-language assistant is the component most at risk of fabricating results, so it is built as a pipeline of independent checks (Figure 3). A structured planner returns a JSON plan rather than free text. The SQL guard accepts exactly one SELECT against one table using an allow-list of functions, and a database-level authorizer enforces the same rules a second time. Execution is read-only with row, column, length and time limits. For multi-row results the model may write an explanation, but every number it cites must reference a specific result cell and is verified before display; if verification fails the exact table is shown instead. Identifier patterns are scanned before output leaves the engine, and every request writes a privacy-aware audit record containing a prompt hash rather than the prompt.'),
  ...figure('fig_assistant_pipeline.png', 520, 'The assistant pipeline. Orange stages are the two independent safeguards against invented content.'),
);

// 4 Methods
children.push(
  h1('4. Methods'),
  h2('4.1 Validation design'),
  p(`The ${n(cohort.in_scope_rows)} in-scope encounters were split 60/20/20 into training (${n(cohort.train.rows)} encounters, ${n(cohort.train.patients)} patients), validation (${n(cohort.validation.rows)}; ${n(cohort.validation.patients)}) and test (${n(cohort.test.rows)}; ${n(cohort.test.patients)}) sets, with every split grouped by patient so no patient appears in more than one. The 30-day readmission rate is similar across the splits (${pct(cohort.train.positive_rate)}, ${pct(cohort.validation.positive_rate)} and ${pct(cohort.test.positive_rate)}). The validation set is used only for model selection and threshold selection; the test set is scored once, after every choice is fixed.`),
  h2('4.2 Features and models'),
  p(`The model uses ${metrics.feature_list.length} input features: demographics, admission type and source, discharge disposition, utilization counts, glucose and HbA1c results, the 23 medication fields, and diagnosis groups following the nine categories of Strack et al. (2014). Derived features are total prior visits, the number of medications with a dose change, the number of active medications, an age midpoint, and indicators for HbA1c testing and insulin dose change. Three candidates were compared: logistic regression (an interpretable baseline), a random forest and LightGBM gradient boosting (Ke et al., 2017). Probabilities were calibrated with cross-validated sigmoid or isotonic calibration. Class weighting was deliberately not used, because it shifts the decision boundary at the expense of probability calibration; the cutoff is instead chosen explicitly.`),
  h2('4.3 Thresholds, uncertainty and calibration'),
  p(`Two operating thresholds were chosen on the validation set: the cutoff maximizing the F1 score (${f3(metrics.thresholds.max_f1)}) and the cutoff flagging the top 10% of encounters by risk (${f3(metrics.thresholds.top_decile)}), a realistic follow-up capacity. Test-set uncertainty is reported as 95% bootstrap intervals from 1,000 resamples, and calibration is assessed with a reliability curve over ten equal-size bins and the Brier score.`),
  h2('4.4 Explainability and fairness'),
  p('Feature contributions were computed with SHAP (Lundberg and Lee, 2017) on the uncalibrated model, so they are expressed on the log-odds scale; contributions of one-hot columns were summed back to their original feature. For fairness, recall, false-positive rate, ROC-AUC and the gap between predicted and observed risk were computed for race, gender and age band on the test set at the operating threshold, following the equal-opportunity framing of Hardt et al. (2016). Groups with fewer than 100 encounters or fewer than 10 cases of either outcome are suppressed, intervals are Wilson intervals (Wilson, 1927), a gap above 0.10 is flagged, and a flagged gap whose intervals overlap is labelled as possible sampling noise.'),
  h2('4.5 HbA1c replication-style study'),
  p(`Following the question of Strack et al. (2014), encounters were grouped by HbA1c measurement and, for high results, by whether the medication was changed: not measured, measured and normal, measured above 8 with a medication change, and measured above 8 without one. The cohort keeps one encounter per patient (the lowest encounter identifier, a documented proxy for the first), after excluding death and hospice discharges (${n(study.cohort_flow[2].encounters)} patients). A chi-square test compares unadjusted rates; a logistic regression adjusted for age band, race, gender, admission source, discharge disposition, length of stay and primary diagnosis group estimates odds ratios against the “not measured” group; and a likelihood-ratio test checks whether the association depends on primary diagnosis. This is a replication-style analysis, not an exact reproduction of the published cohort.`),
  h2('4.6 Statistical tooling'),
  p('A two-cohort comparison tool computes chi-square or Fisher exact tests, odds ratios with Woolf intervals and Cohen’s h for binary outcomes, and Welch’s t-test, the Mann–Whitney U test and Cohen’s d for numeric outcomes. Every distribution function and test was implemented without external dependencies and validated against SciPy reference values to a relative tolerance of 1e-5 or better.'),
);

// 5 Results
const lr = metrics.candidate_results.logistic_regression;
const rf = metrics.candidate_results.random_forest;
const lg = metrics.candidate_results.lightgbm;
children.push(
  h1('5. Results'),
  h2('5.1 Predictive performance'),
  p(`On the validation set the three candidates were close (Table 1); LightGBM had the highest ROC-AUC and was selected. On the held-out test set it achieves a ROC-AUC of **${f3(metrics.roc_auc)}** (95% CI ${f3(metrics.roc_auc_ci95[0])}–${f3(metrics.roc_auc_ci95[1])}) and a PR-AUC of ${f3(metrics.pr_auc)} (95% CI ${f3(metrics.pr_auc_ci95[0])}–${f3(metrics.pr_auc_ci95[1])}) against a no-skill baseline of ${f3(metrics.prevalence)}, about ${(metrics.pr_auc / metrics.prevalence).toFixed(1)} times better than chance. The Brier score is ${metrics.brier_score.toFixed(4)}. This is modest discrimination, in line with published readmission models; the calibration curve (Figure 4) shows that the predicted probabilities track observed rates closely, which matters for any use of the score as a probability.`),
  caption('Table', 'Validation performance of the three candidate models (patient-grouped validation set).'),
  table(
    ['Model', 'ROC-AUC', 'PR-AUC', 'Brier score'],
    [
      ['Logistic regression (calibrated)', f3(lr.validation_roc_auc), f3(lr.validation_pr_auc), lr.validation_brier_score.toFixed(4)],
      ['Random forest (calibrated)', f3(rf.validation_roc_auc), f3(rf.validation_pr_auc), rf.validation_brier_score.toFixed(4)],
      ['LightGBM (calibrated, selected)', f3(lg.validation_roc_auc), f3(lg.validation_pr_auc), lg.validation_brier_score.toFixed(4)],
    ],
    [3960, 1800, 1800, 1800],
  ),
  spacer(),
  ...sideBySide('fig_roc.png', 'fig_calibration.png', 'ROC curve (left) and calibration (right) on the held-out test set.'),
  h2('5.2 The threshold matters more than the score'),
  p(`A risk score becomes a decision only through a cutoff, and the choice changes the result far more than the choice of model (Table 2, Figure 5). At the conventional 0.5 cutoff the model flags ${pct(th['default_0.5'].flagged_fraction)} of encounters and catches only ${pct(th['default_0.5'].recall)} of readmissions. At the validation-chosen maximum-F1 cutoff it catches ${pct(th.max_f1.recall)} with ${pct(th.max_f1.precision)} precision while flagging ${pct(th.max_f1.flagged_fraction)} of encounters; at the capacity-limited top-10% cutoff it catches ${pct(th.top_decile.recall)} with ${pct(th.top_decile.precision)} precision. Which operating point is right depends on the cost of a missed readmission against the cost of an unnecessary follow-up, a decision for the care team rather than the model.`),
  caption('Table', 'Test-set performance at three decision thresholds (thresholds fixed on validation data).'),
  table(
    ['Threshold', 'Cutoff', 'Recall', 'Precision', 'Specificity', 'Flagged'],
    [
      ['Default', '0.500', pct(th['default_0.5'].recall), pct(th['default_0.5'].precision), pct(th['default_0.5'].specificity), pct(th['default_0.5'].flagged_fraction)],
      ['Maximum F1 (operating)', f3(th.max_f1.threshold), pct(th.max_f1.recall), pct(th.max_f1.precision), pct(th.max_f1.specificity), pct(th.max_f1.flagged_fraction)],
      ['Top 10% capacity', f3(th.top_decile.threshold), pct(th.top_decile.recall), pct(th.top_decile.precision), pct(th.top_decile.specificity), pct(th.top_decile.flagged_fraction)],
    ],
    [2760, 1000, 1200, 1400, 1600, 1400],
  ),
  spacer(),
  ...figure('fig_thresholds.png', 470, 'Recall, precision and share of encounters flagged at the three thresholds.'),
  h2('5.3 What drives the predictions'),
  p(`The most influential features (Figure 6) are the number of prior inpatient visits (mean absolute SHAP ${top('number_inpatient').mean_abs_contribution.toFixed(3)}) and the discharge disposition (${top('discharge_disposition_id').mean_abs_contribution.toFixed(3)}), followed by total prior visits, primary diagnosis group, length of stay, number of diagnoses, age and number of medications. More prior admissions, longer stays, more diagnoses and more medications all raise predicted risk, which is clinically plausible. Discharge to a rehabilitation facility raises risk the most (mean contribution ${top('discharge_disposition_id').direction.raises_risk_most[0].mean_contribution.toFixed(2)} log-odds) and discharge home lowers it. These are associations learned by the model, not causal effects.`),
  ...figure('fig_shap.png', 470, 'Global feature importance (mean absolute SHAP value) on a seeded sample of held-out encounters.'),
  h2('5.4 Fairness across subgroups'),
  p(`At the operating threshold, recall ranges across race groups from ${race.gaps.recall.lowest_value.toFixed(2)} (${race.gaps.recall.lowest_group}) to ${race.gaps.recall.highest_value.toFixed(2)} (${race.gaps.recall.highest_group}), a gap of ${race.gaps.recall.gap.toFixed(2)} that exceeds the 0.10 review threshold. The Asian group has only ${race.groups.Asian.n} test encounters and ${race.groups.Asian.readmissions} readmissions, so its interval is very wide and overlaps the others; this gap is more plausibly sampling noise than evidence of bias. The false-positive rate gap by race (${race.gaps.false_positive_rate.gap.toFixed(2)}) and the gaps by age band are larger relative to their intervals: recall is higher for patients under 40 (${ageBand.groups['<40'].recall.toFixed(2)}) than for those aged 40–59 (${ageBand.groups['40-59'].recall.toFixed(2)}), and the false-positive rate rises with age. Differences by gender are within the review threshold (recall gap ${gender.gaps.recall.gap.toFixed(2)}). These differences may partly reflect different base rates and access to care rather than model bias, and the audit is a visibility tool, not a fairness certification.`),
  ...figure('fig_fairness.png', 560, 'Recall by subgroup at the operating threshold with 95% Wilson intervals; the dashed line is the overall recall.'),
  h2('5.5 HbA1c measurement and readmission'),
  p(`Among ${n(study.adjusted_model.n)} patients (one encounter each), the unadjusted 30-day readmission rate was ${pct(rates.not_measured.rate, 2)} when HbA1c was not measured, ${pct(rates.normal.rate, 2)} when measured and normal, ${pct(rates.high_changed.rate, 2)} when high with a medication change and ${pct(rates.high_no_change.rate, 2)} when high without a change (chi-square ${study.chi_square.chi2.toFixed(2)}, ${study.chi_square.dof} degrees of freedom, p = ${pval(study.chi_square.p_value)}; Cramér’s V = ${study.chi_square.cramers_v.toFixed(3)}, a very small association). After adjustment, all three measured groups have an odds ratio below 1 relative to “not measured” (normal ${ors.normal.odds_ratio.toFixed(2)}, 95% CI ${ors.normal.ci95[0].toFixed(2)}–${ors.normal.ci95[1].toFixed(2)}, p = ${pval(ors.normal.p_value)}; high with change ${ors.high_changed.odds_ratio.toFixed(2)}, p = ${pval(ors.high_changed.p_value)}; high without change ${ors.high_no_change.odds_ratio.toFixed(2)}, p = ${pval(ors.high_no_change.p_value)}), but none is individually significant at the 5% level. The association does depend on primary diagnosis (likelihood-ratio χ² = ${study.interaction.lr_statistic.toFixed(1)}, ${study.interaction.df} degrees of freedom, p = ${pval(study.interaction.p_value)}).`),
  p('The direction agrees with the headline finding of the published study, that HbA1c measurement was associated with lower readmission and that the relationship varied by diagnosis, but this replication-style analysis does not reproduce individually significant effects. Differences in cohort definition and in the adjustment set could account for this, and the exact figures of the publication were not compared. Because HbA1c testing is itself clinically selected, none of this supports a causal claim.'),
  ...figure('fig_hba1c.png', 520, 'Unadjusted readmission rate by HbA1c group (left) and adjusted odds ratios against “not measured” (right).'),
);

// 6 Assistant
children.push(
  h1('6. Evaluation of the AI assistant'),
  p('The assistant was evaluated live against twelve curated questions covering counts, averages, rates by group and “which group has the most” questions, using a local Qwen 2.5 14B model. A run counts as correct when it returns a successful status and the same number of rows as a reference SQL query. All twelve questions passed in the final run, with median latencies from about 16 seconds for single-number answers to about 100 seconds for narrated multi-row answers on the available hardware. Each curated question’s reference SQL is also validated by automated tests against the SQL guard and the real database schema, and the whole system is covered by 266 engine and 182 frontend automated tests that pass without calling any language model.'),
  p('Live testing found three defects that unit tests had not, each now fixed and covered by tests:'),
  bullet('**Unsupported SQL constructs.** For “which race has the most lab procedures?” the model wrote a window function that the guard correctly rejected. The prompt now lists exactly the available functions, and a rejected query gets one repair attempt in which the model is told why it was rejected.'),
  bullet('**Over-strict evidence checking.** Honest rounded values such as “10.0%” for a stored 10.037 were rejected, so useful explanations fell back to bare tables. The check now accepts correct rounding and numbers that come from the user’s own question, while still rejecting any unsupported number (it also caught a case where the model swapped two values).'),
  bullet('**A prompt regression.** Advice added to answer “which group has the most” leaked into “compare by group” questions, which then returned a single row. The live check caught it before any demonstration, and the guidance now applies only to single-top-group questions.'),
  p('Retries are bounded by a request-time budget so that they cannot push a response past the browser’s deadline, and a written explanation is not guaranteed: when it cannot be verified, the exact table is shown.'),
);

// 7 Discussion
children.push(
  h1('7. Discussion'),
  p(`**A modest AUC is the expected result, and the evaluation is the contribution.** An AUC of ${f3(metrics.roc_auc)} means the model ranks a random readmitted encounter above a random non-readmitted one about two times in three. Administrative fields such as counts and codes carry limited information about who will return; strong predictors such as functional status, social support and post-discharge follow-up are absent. Reporting intervals, a no-skill baseline, calibration, thresholds and subgroup behaviour lets a reader judge the model for themselves instead of trusting a single headline number.`),
  p('**Thresholds and capacity.** The same model is nearly useless at a cutoff of 0.5 and reasonably informative at validation-chosen cutoffs. The scenario calculator in the application makes this concrete by letting a user choose a follow-up capacity and an assumed intervention effect; it shows no benefit until the user supplies an assumption, and labels its output as a scenario rather than a forecast.'),
  p('**Fairness.** The audit shows why intervals and minimum group sizes matter: the largest apparent gap (race) is driven by a group of 122 encounters, while smaller gaps by age are better supported. Sensible next steps would be subgroup-specific calibration checks and a decision about whether equal recall or equal precision is the appropriate goal for the intended use.'),
  h2('7.1 Limitations'),
  bullet('Observational, administrative data from 1999–2008 at 130 US hospitals; practice patterns and coding have changed, so results may not transfer to current care.'),
  bullet('No dates: no temporal validation, no seasonality, and “first encounter” is a proxy.'),
  bullet('The test set comes from the same data source as training; external validation was not possible.'),
  bullet('Calibration uses cross-validation inside the training split, which is not patient-grouped; the held-out calibration curve is the independent check.'),
  bullet('Risk scores stored in the database include encounters used for training and are optimistic for those rows; held-out figures are the trustworthy measure.'),
  bullet('Small subgroups limit fairness conclusions, and fairness was assessed only on recorded race, gender and age.'),
  bullet('The HbA1c analysis is a replication-style approximation and cannot support causal claims.'),
);

// 8 Ethics
children.push(
  h1('8. Ethics and responsible use'),
  p('The data are de-identified and publicly available, and the application treats them as sensitive regardless: identifier columns are never selectable by the assistant, outbound text is scanned for identifier patterns, prompts are stored only as hashes with a redacted excerpt, and a separate audit database is unreachable by the assistant’s queries. The model is documented in a model card that states its intended use (teaching), its data, its limitations and its subgroup behaviour, and every prediction page carries a not-for-clinical-use notice.'),
  p('Several design choices were made to avoid overstating results: both definitions of readmission are labelled, demonstration-only screens that depend on data the dataset lacks (beds, staff, departments) are hidden by default and badged when shown, executive findings are generated by rules from saved results, and the assistant’s numbers must be traceable to the query result. Any real deployment would additionally need clinical validation, local retraining and recalibration, governance for drift monitoring and rollback, human oversight of any care decision, and real authentication with role-based access; the current login is a client-side demonstration and is not a security boundary.'),
);

// 9 Conclusion
children.push(
  h1('9. Conclusion and future work'),
  p(`The project delivers a leakage-safe, calibrated and explained readmission model whose limits are stated alongside its results (ROC-AUC ${f3(metrics.roc_auc)}; ${pct(th.max_f1.recall)} recall at ${pct(th.max_f1.precision)} precision at the operating threshold), a subgroup audit that distinguishes supported gaps from likely noise, a replication-style inference study with honest conclusions, and an AI assistant whose answers are validated, read-only and evidence-checked. The principal lesson is methodological: with modest predictive signal, careful design of the split, the threshold and the reporting determines whether results can be trusted.`),
  p('Future work includes external or temporal validation if dated data become available; richer features such as laboratory values and social determinants; subgroup-specific calibration and threshold analysis; drift monitoring and a formal model-governance process; evaluation of the assistant on a larger, independently written question set and with more than one model; and server-side authentication with audited access.'),
);

// References
children.push(
  h1('References'),
  p('Hardt, M., Price, E. and Srebro, N. (2016). Equality of opportunity in supervised learning. Advances in Neural Information Processing Systems 29.', { after: 80 }),
  p('Kansagara, D., Englander, H., Salanitro, A., et al. (2011). Risk prediction models for hospital readmission: a systematic review. JAMA, 306(15), 1688–1698.', { after: 80 }),
  p('Ke, G., Meng, Q., Finley, T., et al. (2017). LightGBM: a highly efficient gradient boosting decision tree. Advances in Neural Information Processing Systems 30.', { after: 80 }),
  p('Lundberg, S. M. and Lee, S.-I. (2017). A unified approach to interpreting model predictions. Advances in Neural Information Processing Systems 30.', { after: 80 }),
  p('Mitchell, M., Wu, S., Zaldivar, A., et al. (2019). Model cards for model reporting. Proceedings of the Conference on Fairness, Accountability, and Transparency.', { after: 80 }),
  p('Niculescu-Mizil, A. and Caruana, R. (2005). Predicting good probabilities with supervised learning. Proceedings of the 22nd International Conference on Machine Learning.', { after: 80 }),
  p('Strack, B., DeShazo, J. P., Gennings, C., et al. (2014). Impact of HbA1c measurement on hospital readmission rates: analysis of 70,000 clinical database patient records. BioMed Research International, 2014, Article 781670.', { after: 80 }),
  p('UCI Machine Learning Repository. Diabetes 130-US hospitals for years 1999–2008 data set.', { after: 80 }),
  p('Wilson, E. B. (1927). Probable inference, the law of succession, and statistical inference. Journal of the American Statistical Association, 22(158), 209–212.', { after: 80 }),
);

// Appendix
children.push(
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Appendix A. Reproducing the results')], pageBreakBefore: true, keepNext: true }),
  p('All results are regenerated from the repository root in this order; each step reads what the previous one wrote:'),
  bullet('python -m engine.ml.train_readmission_model — train, select, evaluate, choose thresholds'),
  bullet('python -m engine.ml.apply_predictions — score every encounter into the database'),
  bullet('python -m engine.ml.explain_model — SHAP explanations'),
  bullet('python -m engine.ml.fairness_audit — subgroup audit'),
  bullet('python -m engine.analysis.hba1c_study — HbA1c replication-style study'),
  bullet('python -m engine.analysis.data_quality — data-quality profile and lineage'),
  p('The web application (Data Quality, Research, Predictive, Executive Summary and Analysis Report pages) renders these artifacts directly; the Analysis Report page produces a printable version of the key results. Automated checks are run with pytest (engine), npm test (frontend) and npm run smoke (every page, banned-text and PDF checks).'),
  p(`Model version evaluated: ${metrics.model_version}.`, { color: GREY, size: 18 }),
);

// ---------- document ----------
const doc = new Document({
  creator: 'MedOrch project',
  title: 'Predicting and Understanding 30-Day Hospital Readmission in Diabetes',
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: HEAD_FONT, size: 32, bold: true, color: NAVY }, paragraph: { spacing: { before: 360, after: 140 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: HEAD_FONT, size: 25, bold: true, color: TEAL }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }],
  },
  sections: [
    {
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1300, left: 1440 } }, titlePage: true },
      headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: 'Predicting and Understanding 30-Day Hospital Readmission in Diabetes', size: 17, color: GREY })], alignment: AlignmentType.RIGHT })] }), first: new Header({ children: [new Paragraph({ children: [] })] }) },
      footers: {
        default: new Footer({ children: [new Paragraph({ children: [new TextRun({ children: ['Page ', PageNumber.CURRENT], size: 17, color: GREY })], alignment: AlignmentType.CENTER })] }),
        first: new Footer({ children: [new Paragraph({ children: [] })] }),
      },
      children,
    },
  ],
});

const outFile = path.join(here, '..', 'MedOrch_Report.docx');
writeFileSync(outFile, await Packer.toBuffer(doc));
console.log('wrote', path.relative(root, outFile));

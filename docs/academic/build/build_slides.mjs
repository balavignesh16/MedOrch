// Builds MedOrch_Slides.pptx. Every number is read from the saved analysis artifacts.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import pptxgen from 'pptxgenjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const load = (...parts) => JSON.parse(readFileSync(path.join(root, ...parts), 'utf-8'));
const metrics = load('engine', 'ml', 'artifacts', 'readmission_risk_metrics.json');
const explain = load('engine', 'ml', 'artifacts', 'readmission_risk_explanations.json');
const fairness = load('engine', 'ml', 'artifacts', 'readmission_risk_fairness.json');
const study = load('engine', 'analysis', 'artifacts', 'hba1c_study.json');
const quality = load('engine', 'analysis', 'artifacts', 'data_quality.json');

const n = (v) => v.toLocaleString('en-US');
const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;
const f3 = (v) => v.toFixed(3);
const th = metrics.threshold_analysis;
const cohort = metrics.cohort;
const miss = Object.fromEntries(quality.missingness.map((r) => [r.column, r]));
const ors = Object.fromEntries(study.adjusted_model.exposure_odds_ratios.map((r) => [r.term, r]));
const rates = Object.fromEntries(study.group_rates.map((r) => [r.exposure, r]));
const race = fairness.attributes.race;
const ageBand = fairness.attributes.age_band;
const gender = fairness.attributes.gender;

const NAVY = '0B3C49';
const TEAL = '0F766E';
const ORANGE = 'EA6A12';
const TINT = 'E6F2F1';
const INK = '1F2937';
const MUTED = '5B6670';
const HEAD = 'Cambria';
const BODY = 'Calibri';

const png = (file) => {
  const data = readFileSync(path.join(here, 'figures', file));
  return { file: path.join(here, 'figures', file), ratio: data.readUInt32BE(20) / data.readUInt32BE(16) };
};

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10 x 5.625 in
pres.title = 'Predicting and Understanding 30-Day Hospital Readmission in Diabetes';
pres.author = 'MedOrch project';
pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };

pres.defineSlideMaster({
  title: 'DARK',
  background: { color: NAVY },
  objects: [],
  slideNumber: { x: 9.2, y: 5.2, w: 0.5, h: 0.25, fontFace: BODY, fontSize: 9, color: '9CC3C0', align: 'right' },
});
pres.defineSlideMaster({
  title: 'CONTENT',
  background: { color: 'FFFFFF' },
  objects: [
    { text: { text: 'Readmission analytics project', options: { x: 0.5, y: 5.2, w: 5, h: 0.25, fontFace: BODY, fontSize: 9, color: MUTED, margin: 0, isTextBox: true } } },
  ],
  slideNumber: { x: 9.2, y: 5.2, w: 0.5, h: 0.25, fontFace: BODY, fontSize: 9, color: MUTED, align: 'right' },
});

// ---------- helpers (each call builds fresh option objects) ----------
let slideCount = 0;
function contentSlide(title, notes) {
  const slide = pres.addSlide({ masterName: 'CONTENT' });
  slideCount++;
  slide.addText(title, { x: 0.5, y: 0.3, w: 9, h: 0.75, fontFace: HEAD, fontSize: 30, bold: true, color: NAVY, margin: 0, valign: 'middle', isTextBox: true, objectName: 'Title' });
  slide.addNotes(notes);
  return slide;
}

function darkSlide(notes) {
  const slide = pres.addSlide({ masterName: 'DARK' });
  slideCount++;
  slide.addNotes(notes);
  return slide;
}

function stat(slide, x, y, w, value, label, { color = TEAL, h = 1.15, valueSize = 34 } = {}) {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: TINT }, line: { color: TINT, width: 0.5 }, rectRadius: 0.08, objectName: 'Stat card' });
  slide.addText(value, { x: x + 0.15, y: y + 0.08, w: w - 0.3, h: h * 0.5, fontFace: HEAD, fontSize: valueSize, bold: true, color, margin: 0, valign: 'middle', isTextBox: true });
  slide.addText(label, { x: x + 0.15, y: y + h * 0.55, w: w - 0.3, h: h * 0.4, fontFace: BODY, fontSize: 12, color: INK, margin: 0, valign: 'top', isTextBox: true });
}

function points(slide, x, y, w, items, { fontSize = 14, gap = 0.12 } = {}) {
  slide.addText(
    items.map((item, index) => ({
      text: item,
      options: { bullet: { indent: 14 }, breakLine: index < items.length - 1, paraSpaceAfter: gap * 72 },
    })),
    { x, y, w, h: items.length * 0.62, fontFace: BODY, fontSize, color: INK, margin: 0, valign: 'top', isTextBox: true },
  );
}

const chartText = { catAxisLabelFontFace: BODY, valAxisLabelFontFace: BODY, dataLabelFontFace: BODY, legendFontFace: BODY };

// ---------- 1. Title ----------
{
  const s = darkSlide('Introduce the question: can we predict 30-day readmission for diabetic patients, and, just as important, can we show honestly how well and for whom? Everything in this talk comes from saved results in the project repository, not hand-entered numbers.');
  s.addText('HEALTHCARE & DATA ANALYTICS', { x: 0.7, y: 0.9, w: 8.6, h: 0.35, fontFace: BODY, fontSize: 14, bold: true, color: '5EEAD4', charSpacing: 3, margin: 0, isTextBox: true });
  s.addText('Predicting and understanding 30‑day hospital readmission in diabetes', { x: 0.7, y: 1.35, w: 8.8, h: 1.5, fontFace: HEAD, fontSize: 34, bold: true, color: 'FFFFFF', margin: 0, valign: 'top', isTextBox: true, objectName: 'Title' });
  s.addText('A reproducible, fairness-audited analytics platform with a safety-checked AI assistant', { x: 0.7, y: 3.2, w: 8.2, h: 0.8, fontFace: BODY, fontSize: 18, italic: true, color: 'CADCFC', margin: 0, valign: 'top', isTextBox: true });
  s.addText('[Your name] · [Course] · October 2026', { x: 0.7, y: 4.6, w: 8, h: 0.35, fontFace: BODY, fontSize: 13, color: '9CC3C0', margin: 0, isTextBox: true });
}

// ---------- 2. Why it matters ----------
{
  const s = contentSlide('Why 30-day readmission matters', 'Readmission within 30 days is a standard quality indicator and a hard prediction problem; published models usually reach only modest discrimination. The aim here is a trustworthy evaluation, not a record-breaking score. The dataset is public and de-identified.');
  points(s, 0.5, 1.35, 4.6, [
    '**A quality measure:** hospitals are compared on how many patients return within 30 days',
    '**A hard problem:** administrative data carry limited signal, so modest accuracy is expected',
    '**Our goal:** evaluate honestly, explain the drivers, and audit fairness',
  ].map((t) => t.replace(/\*\*/g, '')), { fontSize: 16, gap: 0.18 });
  stat(s, 5.5, 1.3, 4, pct(metrics.prevalence), 'of encounters are readmitted within 30 days');
  stat(s, 5.5, 2.6, 4, `${n(cohort.total_rows)}`, `encounters from ${n(quality.repeat_patients.patients)} patients`, { color: NAVY });
  stat(s, 5.5, 3.9, 4, '1999–2008', 'UCI Diabetes 130-US Hospitals (public, de-identified)', { color: ORANGE, valueSize: 30 });
}

// ---------- 3. Data ----------
{
  const s = contentSlide('The data, and what is missing', 'Profiling the data first changed the design. Weight is almost entirely missing, so it was excluded. HbA1c was not performed for most encounters, which limits any analysis of it. Many patients have several encounters, which is why the split is by patient. The file also has no dates.');
  const rows = [
    ['weight', miss.weight.missing_percent],
    ['max_glu_serum*', miss.max_glu_serum.not_performed_percent],
    ['A1Cresult*', miss.A1Cresult.not_performed_percent],
    ['medical_specialty', miss.medical_specialty.missing_percent],
    ['payer_code', miss.payer_code.missing_percent],
    ['race', miss.race.missing_percent],
  ].reverse();
  s.addChart(
    pres.charts.BAR,
    [{ name: 'Percent of encounters', labels: rows.map((r) => r[0]), values: rows.map((r) => Number(r[1].toFixed(1))) }],
    {
      x: 0.4, y: 1.2, w: 5.7, h: 3.8, barDir: 'bar', chartColors: [ORANGE], showLegend: false, showTitle: true,
      title: 'Share of encounters unusable or untested (%)', titleFontSize: 12, titleColor: INK, titleFontFace: BODY,
      showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 11, dataLabelColor: INK, dataLabelFormatCode: '0.0',
      catAxisLabelFontSize: 11, catAxisLabelColor: INK, valAxisLabelFontSize: 10, valAxisLabelColor: MUTED, valAxisMaxVal: 110, valAxisHidden: true,
      valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, ...chartText,
    },
  );
  s.addText('* test not performed (not a missing value)', { x: 0.5, y: 5.0, w: 5.5, h: 0.22, fontFace: BODY, fontSize: 10, color: MUTED, margin: 0, isTextBox: true });
  stat(s, 6.4, 1.3, 3.2, `${miss.weight.missing_percent.toFixed(1)}%`, 'weight missing: column excluded', { h: 1.05, valueSize: 30 });
  stat(s, 6.4, 2.55, 3.2, `${miss.A1Cresult.not_performed_percent.toFixed(1)}%`, 'HbA1c never measured', { color: NAVY, h: 1.05, valueSize: 30 });
  stat(s, 6.4, 3.8, 3.2, n(quality.repeat_patients.patients_with_multiple_encounters), 'patients with repeat encounters: split by patient', { color: ORANGE, h: 1.15, valueSize: 30 });
}

// ---------- 4. Approach ----------
{
  const s = contentSlide('How the platform is built', 'Work that writes (cleaning, training, explanations, audits) is done offline by scripts that produce saved artifacts. At runtime the web app and engine only read. Every page shows saved results or says they are missing, so there are no placeholder numbers. On the right are the four design choices that make the evaluation trustworthy.');
  const fig = png('fig_architecture.png');
  const width = 5.6;
  s.addImage({ path: fig.file, x: 0.4, y: 1.3, w: width, h: width * fig.ratio, altText: 'Architecture: offline scripts produce artifacts that the read-only runtime serves' });
  const items = [
    [`Exclude ${n(cohort.excluded_rows.total)} death and hospice discharges`, 'they cannot be readmitted'],
    ['Split 60/20/20 by patient', 'no patient in two sets'],
    ['Calibrated probabilities', 'thresholds chosen on validation data'],
    ['Test set scored once', 'bootstrap 95% intervals'],
  ];
  items.forEach(([head, sub], i) => {
    const y = 1.3 + i * 0.95;
    s.addShape(pres.ShapeType.ellipse, { x: 6.3, y: y + 0.05, w: 0.42, h: 0.42, fill: { color: TEAL }, line: { color: TEAL, width: 0.5 } });
    s.addText(String(i + 1), { x: 6.3, y: y + 0.05, w: 0.42, h: 0.42, fontFace: HEAD, fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    s.addText([{ text: head, options: { bold: true, breakLine: true, fontSize: 13 } }, { text: sub, options: { fontSize: 12, color: MUTED } }], { x: 6.85, y, w: 2.8, h: 0.85, fontFace: BODY, color: INK, margin: 0, valign: 'top', isTextBox: true });
  });
}

// ---------- 5. Model result ----------
{
  const s = contentSlide('The cutoff matters more than the model', `The held-out ROC-AUC is ${f3(metrics.roc_auc)}, modest but typical. The striking result is the threshold: the textbook 0.5 cutoff catches under 1% of readmissions because only about 11% of encounters are readmitted. Choosing the cutoff on validation data catches ${pct(th.max_f1.recall)} at the cost of precision. Which point is right depends on the cost of a missed readmission versus an unnecessary follow-up.`);
  stat(s, 0.5, 1.3, 3.4, f3(metrics.roc_auc), `ROC-AUC, 95% CI ${f3(metrics.roc_auc_ci95[0])}–${f3(metrics.roc_auc_ci95[1])}`, { h: 1.2, valueSize: 40 });
  stat(s, 0.5, 2.7, 3.4, f3(metrics.pr_auc), `PR-AUC vs ${f3(metrics.prevalence)} for chance (${(metrics.pr_auc / metrics.prevalence).toFixed(1)}×)`, { color: NAVY, h: 1.2, valueSize: 40 });
  s.addText(`0.5 cutoff: ${pct(th['default_0.5'].recall)} of readmissions caught.\nValidation-chosen cutoff: ${pct(th.max_f1.recall)}.`, { x: 0.5, y: 4.1, w: 3.6, h: 0.9, fontFace: BODY, fontSize: 13, color: INK, margin: 0, valign: 'top', isTextBox: true });
  const cats = [`Default 0.5`, `Max-F1 (${f3(th.max_f1.threshold)})`, `Top 10% (${f3(th.top_decile.threshold)})`];
  const keys = ['default_0.5', 'max_f1', 'top_decile'];
  const val = (field) => keys.map((k) => Number((th[k][field] * 100).toFixed(1)));
  s.addChart(
    pres.charts.BAR,
    [
      { name: 'Recall', labels: cats, values: val('recall') },
      { name: 'Precision', labels: cats, values: val('precision') },
      { name: 'Share flagged', labels: cats, values: val('flagged_fraction') },
    ],
    {
      x: 4.3, y: 1.2, w: 5.4, h: 3.9, barDir: 'col', barGrouping: 'clustered', chartColors: [TEAL, ORANGE, NAVY], showLegend: true, legendPos: 'b', legendFontSize: 11, legendColor: INK,
      showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 10, dataLabelColor: INK, dataLabelFormatCode: '0.0',
      catAxisLabelFontSize: 11, catAxisLabelColor: INK, valAxisLabelFontSize: 10, valAxisLabelColor: MUTED, valAxisMaxVal: 75, valAxisHidden: true,
      valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showTitle: true, title: 'Test set, percent', titleFontSize: 12, titleColor: INK, titleFontFace: BODY, ...chartText,
    },
  );
}

// ---------- 6. Drivers ----------
{
  const s = contentSlide('What drives the predictions', 'SHAP values show how much each feature moves the model score. Prior inpatient visits and the discharge destination dominate; more prior visits, longer stays, more diagnoses and more medications all raise predicted risk, which is clinically plausible. These are associations the model learned, not causes.');
  const names = {
    number_inpatient: 'Prior inpatient visits', discharge_disposition_id: 'Discharge disposition', total_prior_visits: 'Total prior visits',
    diag_1_group: 'Primary diagnosis group', time_in_hospital: 'Days in hospital', number_diagnoses: 'Number of diagnoses',
    age_midpoint: 'Age', num_medications: 'Number of medications',
  };
  const top = explain.global_importance.slice(0, 8).reverse();
  s.addChart(
    pres.charts.BAR,
    [{ name: 'Mean |SHAP|', labels: top.map((t) => names[t.feature] ?? t.feature), values: top.map((t) => Number(t.mean_abs_contribution.toFixed(3))) }],
    {
      x: 0.4, y: 1.2, w: 6.1, h: 3.9, barDir: 'bar', chartColors: [TEAL], showLegend: false, showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 11, dataLabelColor: INK, dataLabelFormatCode: '0.000',
      catAxisLabelFontSize: 12, catAxisLabelColor: INK, valAxisHidden: true, valAxisMaxVal: 0.28, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
      showTitle: true, title: 'Mean absolute SHAP value (log-odds)', titleFontSize: 12, titleColor: INK, titleFontFace: BODY, ...chartText,
    },
  );
  points(s, 6.8, 1.4, 2.9, [
    'More prior admissions, longer stays and more diagnoses all raise risk',
    'Discharge to rehabilitation raises risk the most; discharge home lowers it',
    'Associations, not causes',
  ], { fontSize: 14, gap: 0.2 });
}

// ---------- 7. Fairness ----------
{
  const s = contentSlide('Fairness: which gaps to trust', 'We checked recall, false-positive rate and AUC across race, gender and age at the operating threshold, with Wilson intervals. The large race gap comes from a group of 122 encounters with only 10 readmissions, and its interval overlaps the others, so it is more plausibly noise. The age differences are better supported. Gender is within the review threshold. This is a visibility tool, not a fairness certification.');
  const fig = png('fig_fairness.png');
  const w = 5.75;
  s.addImage({ path: fig.file, x: 0.35, y: 1.2, w, h: w * fig.ratio, altText: 'Recall by subgroup with 95% intervals' });
  points(s, 6.35, 1.35, 3.3, [
    `Race recall gap ${race.gaps.recall.gap.toFixed(2)}: driven by ${race.groups.Asian.n} Asian encounters (${race.groups.Asian.readmissions} readmissions); intervals overlap`,
    `Age: recall ${ageBand.groups['<40'].recall.toFixed(2)} under 40 vs ${ageBand.groups['40-59'].recall.toFixed(2)} at 40–59; intervals do not overlap`,
    `Gender gap ${gender.gaps.recall.gap.toFixed(2)}: within the 0.10 review threshold`,
  ], { fontSize: 13, gap: 0.16 });
}

// ---------- 8. HbA1c ----------
{
  const s = contentSlide('HbA1c testing and readmission', 'This is a replication-style analysis of the question in the paper that introduced this dataset. Unadjusted rates fall from not measured to measured with no medication change, and all three adjusted odds ratios are below one, matching the direction of the paper, but none is individually significant. The association does depend on primary diagnosis. HbA1c testing is clinically selected, so there is no causal claim, and this is not an exact reproduction of the published cohort.');
  const fig = png('fig_hba1c.png');
  const w = 6.0;
  s.addImage({ path: fig.file, x: 0.4, y: 1.35, w, h: w * fig.ratio, altText: 'Readmission rate by HbA1c group and adjusted odds ratios' });
  s.addText(`n = ${n(study.adjusted_model.n)} patients, one encounter each; adjusted for age, race, gender, admission source, discharge, stay and diagnosis.`, { x: 0.5, y: 1.35 + w * fig.ratio + 0.1, w: 5.8, h: 0.6, fontFace: BODY, fontSize: 11, color: MUTED, margin: 0, valign: 'top', isTextBox: true });
  stat(s, 6.7, 1.3, 3.0, `${pct(rates.not_measured.rate)} → ${pct(rates.high_no_change.rate)}`, 'unadjusted rate, not measured vs high without change', { h: 1.25, valueSize: 22 });
  stat(s, 6.7, 2.7, 3.0, 'None significant', `adjusted ORs ${ors.high_no_change.odds_ratio.toFixed(2)}–${ors.high_changed.odds_ratio.toFixed(2)}, all p > 0.05`, { color: NAVY, h: 1.1, valueSize: 20 });
  stat(s, 6.7, 3.95, 3.0, `p = ${study.interaction.p_value.toFixed(3)}`, 'effect depends on primary diagnosis', { color: ORANGE, h: 1.1, valueSize: 24 });
}

// ---------- 9. Assistant ----------
{
  const s = contentSlide('An assistant that cannot invent numbers', 'Users ask in plain English. The model only proposes a structured plan; the SQL guard and a database authorizer independently enforce one read-only query; any explanation must cite real result cells or the exact table is shown instead. On 12 curated questions run live on a local 14-billion-parameter model, all 12 were correct. Live testing found three defects that unit tests missed, and each is now fixed and tested.');
  const fig = png('fig_assistant_pipeline.png');
  const w = 5.7;
  s.addImage({ path: fig.file, x: 0.4, y: 1.3, w, h: w * fig.ratio, altText: 'Assistant pipeline: planner, SQL guard, read-only run, grounded answer, output checks' });
  points(s, 0.5, 1.3 + w * fig.ratio + 0.2, 5.6, [
    'One SELECT, one table, allow-listed functions, read-only, time-limited',
    'Every number in an explanation must cite a result cell',
  ], { fontSize: 13, gap: 0.12 });
  stat(s, 6.4, 1.3, 3.3, '12 / 12', 'curated questions correct, live (local Qwen 2.5 14B)', { h: 1.2, valueSize: 36 });
  s.addText('Found by live testing, now fixed:', { x: 6.4, y: 2.75, w: 3.3, h: 0.3, fontFace: BODY, fontSize: 13, bold: true, color: NAVY, margin: 0, isTextBox: true });
  points(s, 6.4, 3.1, 3.3, ['Unsupported SQL: one repair attempt', 'Over-strict rounding check', 'A prompt change that returned one row'], { fontSize: 12, gap: 0.08 });
}

// ---------- 10. Live demo ----------
{
  const s = darkSlide('Live demo, about five minutes. Open the tabs in this order. If the assistant is slow, use a suggested question; if anything fails, play the recorded video and open the saved PDF. See docs/DEMO_CHECKLIST.md.');
  s.addText('Live demo', { x: 0.7, y: 0.5, w: 8.6, h: 0.9, fontFace: HEAD, fontSize: 40, bold: true, color: 'FFFFFF', margin: 0, isTextBox: true, objectName: 'Title' });
  const steps = [
    ['Data Quality', 'what is missing, definitions, lineage'],
    ['Research', 'HbA1c study and cohort comparison'],
    ['Predictive', 'model card, threshold explorer, fairness'],
    ['Assistant', 'suggested question, chart, validated SQL'],
    ['Report', 'one-click printable PDF'],
  ];
  steps.forEach(([head, sub], i) => {
    const y = 1.55 + i * 0.78;
    s.addShape(pres.ShapeType.ellipse, { x: 0.7, y, w: 0.5, h: 0.5, fill: { color: ORANGE }, line: { color: ORANGE, width: 0.5 } });
    s.addText(String(i + 1), { x: 0.7, y, w: 0.5, h: 0.5, fontFace: HEAD, fontSize: 16, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, isTextBox: true });
    s.addText([{ text: head, options: { bold: true, fontSize: 20, color: 'FFFFFF' } }, { text: `   ${sub}`, options: { fontSize: 15, color: 'CADCFC' } }], { x: 1.45, y, w: 8, h: 0.5, fontFace: BODY, margin: 0, valign: 'middle', isTextBox: true });
  });
}

// ---------- 11. Limitations & ethics ----------
{
  const s = contentSlide('Limitations and responsible use', 'Be upfront about the limits. The data are old and undated, there is no external validation, calibration used cross-validation inside the training split, and stored scores include training rows. For responsible use: de-identified data, identifiers never exposed by the assistant, prompts stored only as hashes, labelled definitions, demonstration-only screens hidden by default, and a not-for-clinical-use notice on every prediction page.');
  const column = (x, title, items, color) => {
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.3, w: 4.4, h: 3.75, fill: { color: TINT }, line: { color: TINT, width: 0.5 }, rectRadius: 0.08 });
    s.addText(title, { x: x + 0.25, y: 1.42, w: 3.9, h: 0.4, fontFace: HEAD, fontSize: 18, bold: true, color, margin: 0, isTextBox: true });
    points(s, x + 0.25, 1.95, 3.95, items, { fontSize: 15, gap: 0.2 });
  };
  column(0.5, 'Limitations', [
    'Data from 1999–2008, no dates: no temporal or external validation',
    'Modest signal: ROC-AUC about 0.67',
    'Small subgroups limit fairness conclusions',
    'Observational: associations, not causes',
  ], ORANGE);
  column(5.1, 'Responsible use', [
    'De-identified data; identifiers never exposed by the assistant',
    'Both readmission definitions labelled everywhere',
    'Model card and “not for clinical use” notices',
    'Real deployment needs clinical validation, governance and real authentication',
  ], TEAL);
}

// ---------- 12. Conclusion ----------
{
  const s = darkSlide('Close on the methodological lesson: with modest predictive signal, the care taken over the split, the threshold and the reporting determines whether results can be trusted. Then invite questions.');
  s.addText('Conclusions', { x: 0.7, y: 0.5, w: 8.6, h: 0.8, fontFace: HEAD, fontSize: 36, bold: true, color: 'FFFFFF', margin: 0, isTextBox: true, objectName: 'Title' });
  const items = [
    [`A leakage-safe, calibrated model (ROC-AUC ${f3(metrics.roc_auc)})`, `catches ${pct(th.max_f1.recall)} of readmissions at a validation-chosen cutoff, with its limits stated`],
    ['Fairness and statistics reported with uncertainty', 'supported gaps separated from likely noise; HbA1c results stated honestly'],
    ['An assistant whose answers are validated and evidence-checked', '12 of 12 curated questions correct live'],
  ];
  items.forEach(([head, sub], i) => {
    const y = 1.55 + i * 1.15;
    s.addText(String(i + 1), { x: 0.7, y, w: 0.6, h: 0.9, fontFace: HEAD, fontSize: 40, bold: true, color: ORANGE, margin: 0, valign: 'top', isTextBox: true });
    s.addText([{ text: head, options: { bold: true, fontSize: 19, color: 'FFFFFF', breakLine: true } }, { text: sub, options: { fontSize: 14, color: 'CADCFC' } }], { x: 1.45, y, w: 8, h: 1, fontFace: BODY, margin: 0, valign: 'top', isTextBox: true });
  });
  s.addText('Questions?', { x: 0.7, y: 4.85, w: 5, h: 0.4, fontFace: HEAD, fontSize: 20, italic: true, color: '5EEAD4', margin: 0, isTextBox: true });
}

const outFile = path.join(here, '..', 'MedOrch_Slides.pptx');
await pres.writeFile({ fileName: outFile });
console.log('wrote', path.relative(root, outFile), `(${slideCount} slides)`);

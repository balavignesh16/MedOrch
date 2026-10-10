import React from 'react';
import type {
  ReadmissionExplanations,
  ReadmissionFairness,
  ReadmissionMetrics,
} from '@/lib/ml/modelArtifactTypes';
import type { DataQualityProfile } from '@/lib/ml/dataQualityTypes';
import type { Hba1cStudy } from '@/lib/ml/studyArtifactTypes';
import {
  formatCount,
  formatDecimal,
  formatInterval,
  formatPercent,
  thresholdOptions,
  topImportance,
} from '@/lib/ml/modelArtifactViews';
import { consortBoxes, forestRows, formatPValue } from '@/lib/ml/studyViews';
import { missingnessBars } from '@/lib/ml/dataQualityViews';

export interface ReportInputs {
  metrics: ReadmissionMetrics | null;
  explanations: ReadmissionExplanations | null;
  fairness: ReadmissionFairness | null;
  study: Hba1cStudy | null;
  quality: DataQualityProfile | null;
  missing: string[];
}

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 break-inside-avoid-page">
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">
        {number}. {title}
      </h2>
      {children}
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: Array<Array<React.ReactNode>> }) {
  return (
    <table className="w-full text-left text-[12px] border-collapse break-inside-avoid">
      <thead>
        <tr className="border-b-2 border-slate-400 text-slate-600">
          {head.map((cell) => (
            <th key={cell} className="py-1 pr-3 font-semibold">{cell}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-b border-slate-200 text-slate-800">
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="py-1 pr-3 align-top">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Curve({ points, width = 260, height = 200, xLabel, yLabel, diagonal }: {
  points: Array<{ x: number; y: number }>;
  width?: number;
  height?: number;
  xLabel: string;
  yLabel: string;
  diagonal?: boolean;
}) {
  const pad = 32;
  const dataMaxX = Math.max(1e-9, ...points.map((p) => p.x));
  const dataMaxY = Math.max(1e-9, ...points.map((p) => p.y));
  const shared = Math.max(dataMaxX, dataMaxY);
  const maxX = diagonal ? shared : dataMaxX;
  const maxY = diagonal ? shared : dataMaxY;
  const sx = (x: number) => pad + (x / maxX) * (width - pad - 8);
  const sy = (y: number) => height - pad - (y / maxY) * (height - pad - 8);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[280px]" role="img" aria-label={`${yLabel} versus ${xLabel}`}>
      <rect x={pad} y={8} width={width - pad - 8} height={height - pad - 8} fill="none" stroke="#cbd5e1" />
      {diagonal && <line x1={sx(0)} y1={sy(0)} x2={sx(maxX)} y2={sy(maxY)} stroke="#94a3b8" strokeDasharray="4 3" />}
      <polyline fill="none" stroke="#0f766e" strokeWidth={1.8} points={points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')} />
      <text x={width / 2} y={height - 6} textAnchor="middle" fontSize={9} fill="#475569">{xLabel}</text>
      <text x={10} y={height / 2} fontSize={9} fill="#475569" transform={`rotate(-90 10 ${height / 2})`} textAnchor="middle">{yLabel}</text>
    </svg>
  );
}

export function ReportDocument({ metrics, explanations, fairness, study, quality, missing }: ReportInputs) {
  const generated = new Date().toUTCString();
  return (
    <article className="bg-white text-slate-900 rounded-2xl shadow-xl p-10 max-w-4xl mx-auto print:shadow-none print:rounded-none print:p-0 print:max-w-none">
      <header className="border-b-2 border-slate-900 pb-4">
        <p className="text-[11px] uppercase tracking-widest text-slate-500">MedOrch · Healthcare analytics report</p>
        <h1 className="text-3xl font-bold mt-1">30-Day Readmission Risk, Evidence and Data Quality</h1>
        <p className="text-sm text-slate-600 mt-2">
          Historical, de-identified encounters from the UCI Diabetes 130-US Hospitals dataset (1999–2008). Generated {generated}.
        </p>
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-3">
          Teaching demonstration. Not clinically validated; not for clinical, billing, or operational decisions. Every figure is read from
          the saved evaluation artifacts or the database — none is entered by hand.
        </p>
        {missing.length > 0 && (
          <p className="text-xs text-red-700 mt-2">Sections omitted because their artifacts are missing: {missing.join(', ')}.</p>
        )}
      </header>

      {quality && (
        <Section number={1} title="Data and cohort">
          <p className="text-[13px] text-slate-700">
            {formatCount(quality.database_consistency.raw_rows)} encounters from {formatCount(quality.database_consistency.raw_patients)} patients;{' '}
            {formatCount(quality.repeat_patients.patients_with_multiple_encounters)} patients have repeat encounters, so splits and tests must account for
            correlation. The source file and the analytics database {quality.database_consistency.rows_match ? 'agree on the row count' : 'DISAGREE on the row count'}.{' '}
            {formatCount(quality.cohort_exclusions.total_excluded)} encounters ending in death or hospice discharge are excluded from modelling.
          </p>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mt-4 mb-1">Columns with the most missing data</p>
          <Table
            head={['Column', 'Missing', 'Test not performed', 'Status']}
            rows={missingnessBars(quality).slice(0, 6).map((row) => [
              row.column,
              `${row.missingPercent.toFixed(1)}%`,
              row.notPerformedPercent ? `${row.notPerformedPercent.toFixed(1)}%` : '—',
              row.inDatabase ? 'In database' : 'Excluded',
            ])}
          />
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mt-4 mb-1">Definitions in use</p>
          <Table head={['Term', 'Definition']} rows={quality.definitions.map((d) => [d.term, d.definition])} />
        </Section>
      )}

      {metrics && (
        <Section number={2} title="Risk model">
          <p className="text-[13px] text-slate-700">
            {metrics.selected_model} classifier, probability-calibrated, version <span className="font-mono text-[11px]">{metrics.model_version}</span>.
            Target: {metrics.target_definition}. {metrics.split_method} Test set: {formatCount(metrics.cohort.test.rows)} encounters.
          </p>
          <Table
            head={['Metric (held-out test set)', 'Value', '95% interval']}
            rows={[
              ['ROC-AUC', formatDecimal(metrics.roc_auc), formatInterval(metrics.roc_auc_ci95)],
              ['PR-AUC (no-skill baseline ' + formatDecimal(metrics.prevalence) + ')', formatDecimal(metrics.pr_auc), formatInterval(metrics.pr_auc_ci95)],
              ['Brier score', formatDecimal(metrics.brier_score, 4), '—'],
            ]}
          />
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mt-4 mb-1">Decision thresholds (chosen on validation data)</p>
          <Table
            head={['Threshold', 'Cutoff', 'Recall', 'Precision', 'Specificity', 'Flagged']}
            rows={thresholdOptions(metrics).map((option) => [
              option.label,
              formatDecimal(option.metrics.threshold),
              formatPercent(option.metrics.recall),
              formatPercent(option.metrics.precision),
              formatPercent(option.metrics.specificity),
              formatPercent(option.metrics.flagged_fraction),
            ])}
          />
          <div className="flex flex-wrap gap-6 mt-4 break-inside-avoid">
            <div>
              <p className="text-[11px] text-slate-500 mb-1">ROC curve</p>
              <Curve points={metrics.roc_curve.map((p) => ({ x: p.fpr, y: p.tpr }))} xLabel="False-positive rate" yLabel="True-positive rate" diagonal />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 mb-1">Calibration (predicted vs. observed)</p>
              <Curve points={metrics.calibration_curve.map((p) => ({ x: p.mean_predicted, y: p.observed_rate }))} xLabel="Mean predicted risk" yLabel="Observed rate" diagonal />
            </div>
          </div>
          {explanations && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-slate-500 mt-4 mb-1">Most influential features (SHAP)</p>
              <Table
                head={['Feature', 'Mean |SHAP|', 'Direction']}
                rows={topImportance(explanations, 8).map((bar) => [bar.label, bar.importance.toFixed(3), bar.summary])}
              />
            </>
          )}
          <p className="text-[12px] text-slate-600 mt-3">{metrics.literature_context}</p>
        </Section>
      )}

      {fairness && (
        <Section number={3} title="Fairness audit">
          <p className="text-[12px] text-slate-600 mb-2">{fairness.evaluated_on}. Suppression rule: {fairness.suppression_rule}.</p>
          {(['race', 'gender', 'age_band'] as const).map((key) => (
            <div key={key} className="mb-3 break-inside-avoid">
              <p className="text-[12px] font-semibold text-slate-800 capitalize">{key.replace('_', ' ')}</p>
              <p className="text-[12px] text-slate-700">{fairness.attributes[key].interpretation}</p>
            </div>
          ))}
          <p className="text-[11px] text-slate-500">{fairness.caveat}</p>
        </Section>
      )}

      {study && (
        <Section number={4} title="HbA1c measurement and readmission (replication-style)">
          <p className="text-[12px] text-slate-600 mb-2">{study.paper_comparison.citation}</p>
          <Table
            head={['Step', 'Encounters', 'Removed']}
            rows={consortBoxes(study).map((box) => [box.description, formatCount(box.encounters), box.removed ? `−${formatCount(box.removed)}` : '—'])}
          />
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mt-4 mb-1">30-day readmission by group</p>
          <Table
            head={['Group', 'n', 'Rate', '95% CI']}
            rows={study.group_rates.map((row) => [row.label, formatCount(row.n), formatPercent(row.rate, 2), `${formatPercent(row.rate_ci95[0], 2)} – ${formatPercent(row.rate_ci95[1], 2)}`])}
          />
          <p className="text-[12px] text-slate-700 mt-2">
            Chi-square across groups: χ²({study.chi_square.dof}) = {study.chi_square.chi2.toFixed(2)}, p = {formatPValue(study.chi_square.p_value)}.
          </p>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mt-4 mb-1">Adjusted odds ratios (reference: not measured)</p>
          <Table
            head={['Group', 'Odds ratio', '95% CI', 'p']}
            rows={forestRows(study).filter((row) => !row.isReference).map((row) => [row.label, row.odds.toFixed(2), `${row.low.toFixed(2)} – ${row.high.toFixed(2)}`, formatPValue(row.pValue ?? 1)])}
          />
          <p className="text-[12px] text-slate-700 mt-2">{study.interaction.interpretation}</p>
          <p className="text-[12px] text-slate-700 mt-2">
            <span className="font-semibold">Versus the published study: </span>
            {study.paper_comparison.our_results} {study.paper_comparison.assessment} {study.paper_comparison.note}
          </p>
        </Section>
      )}

      {metrics && (
        <Section number={5} title="Limitations">
          <ul className="list-disc pl-5 text-[12px] text-slate-700 space-y-1">
            {Array.from(new Set([...metrics.known_limitations, ...(study?.limitations ?? [])].map((item) => item.replace(/^Data span.*$/, 'Data span 1999-2008 from 130 US hospitals; practice patterns have changed since.'))))
              .filter((item) => !item.startsWith('No dates:'))
              .map((item) => (
                <li key={item}>{item}</li>
              ))}
          </ul>
        </Section>
      )}
    </article>
  );
}

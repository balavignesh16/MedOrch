import React from 'react';
import type { ReadmissionMetrics } from '@/lib/ml/modelArtifactTypes';
import { formatCount, formatDecimal, formatInterval, formatPercent } from '@/lib/ml/modelArtifactViews';
import { Panel, Stat } from './Panel';

export function ModelCard({ metrics }: { metrics: ReadmissionMetrics }) {
  const cohort = metrics.cohort;
  return (
    <div className="space-y-4">
      <Panel
        title="Model card"
        subtitle="Everything below is read from the trained model's saved evaluation — nothing on this page is hardcoded."
        aside={
          <span className="text-[10px] uppercase tracking-widest rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 px-3 py-1">
            Demonstration — not for clinical use
          </span>
        }
      >
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <Row label="Model" value={`${metrics.selected_model} (calibrated)`} />
          <Row label="Version" value={metrics.model_version} mono />
          <Row label="Trained" value={new Date(metrics.trained_at_utc).toUTCString()} />
          <Row label="Training data" value={metrics.training_source} />
          <Row label="Target" value={metrics.target_definition} />
          <Row label="Split" value={metrics.split_method} />
          <Row
            label="Cohort"
            value={`${formatCount(cohort.in_scope_rows)} of ${formatCount(cohort.total_rows)} encounters in scope; ${formatCount(
              cohort.excluded_rows.total,
            )} excluded (${formatCount(cohort.excluded_rows.expired)} expired, ${formatCount(
              cohort.excluded_rows.hospice,
            )} hospice discharge — they cannot be readmitted)`}
          />
          <Row
            label="Partitions (patient-grouped)"
            value={`train ${formatCount(cohort.train.rows)} · validation ${formatCount(cohort.validation.rows)} · test ${formatCount(
              cohort.test.rows,
            )} encounters`}
          />
          <Row label="Intended use" value="Teaching demonstration of risk modelling on historical, de-identified data." />
          <Row label="Features" value={`${metrics.feature_list.length} (see SHAP chart for the most influential)`} />
        </dl>
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Known limitations</p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-white/60">
            {metrics.known_limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </Panel>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="ROC-AUC (test)"
          value={formatDecimal(metrics.roc_auc)}
          hint={`95% CI ${formatInterval(metrics.roc_auc_ci95)}`}
        />
        <Stat
          label="PR-AUC (test)"
          value={formatDecimal(metrics.pr_auc)}
          hint={`95% CI ${formatInterval(metrics.pr_auc_ci95)} · baseline ${formatDecimal(metrics.prevalence)}`}
        />
        <Stat label="Brier score" value={formatDecimal(metrics.brier_score, 4)} hint="Lower is better; probability error" />
        <Stat label="30-day prevalence" value={formatPercent(metrics.prevalence)} hint="Share of test encounters readmitted <30 days" />
      </div>
      <p className="text-xs text-white/50">
        PR-AUC should be read against its baseline: a model with no skill scores about the prevalence, so{' '}
        {formatDecimal(metrics.pr_auc)} is roughly {(metrics.pr_auc / metrics.prevalence).toFixed(1)}× better than chance.{' '}
        {metrics.literature_context}
      </p>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-white/40">{label}</dt>
      <dd className={`text-white/80 ${mono ? 'font-mono text-xs break-all' : ''}`}>{value}</dd>
    </div>
  );
}

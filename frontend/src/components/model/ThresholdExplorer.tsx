'use client';

import React, { useState } from 'react';
import type { ReadmissionMetrics } from '@/lib/ml/modelArtifactTypes';
import {
  confusionCells,
  formatCount,
  formatDecimal,
  formatPercent,
  thresholdOptions,
  type ThresholdKey,
} from '@/lib/ml/modelArtifactViews';
import { Panel, Stat } from './Panel';

export function ThresholdExplorer({ metrics }: { metrics: ReadmissionMetrics }) {
  const options = thresholdOptions(metrics);
  const [selected, setSelected] = useState<ThresholdKey>('max_f1');
  const active = options.find((option) => option.key === selected) ?? options[1];
  const cells = confusionCells(active.metrics);
  const testRows = metrics.cohort.test.rows;

  return (
    <Panel
      title="Threshold explorer"
      subtitle="A risk score becomes a decision only through a cutoff. Pick one to see the trade-off on the held-out test set (precomputed, not recalculated here)."
    >
      <div className="flex flex-wrap gap-2 mb-4">
        {options.map((option) => (
          <button
            key={option.key}
            onClick={() => setSelected(option.key)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              option.key === selected
                ? 'bg-brand-teal/20 border-brand-teal text-brand-teal'
                : 'bg-black/30 border-white/10 text-white/70 hover:border-brand-teal/40'
            }`}
          >
            {option.label} · {formatDecimal(option.metrics.threshold, 3)}
          </button>
        ))}
      </div>
      <p className="text-xs text-white/50 mb-4">{active.description}</p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <Stat label="Recall" value={formatPercent(active.metrics.recall)} hint="Readmissions caught" />
        <Stat label="Precision" value={formatPercent(active.metrics.precision)} hint="Flagged who were readmitted" />
        <Stat label="Specificity" value={formatPercent(active.metrics.specificity)} hint="Non-readmissions left alone" />
        <Stat label="F1" value={formatDecimal(active.metrics.f1)} />
        <Stat label="Flagged" value={formatPercent(active.metrics.flagged_fraction)} hint="Share of encounters" />
      </div>

      <div className="grid grid-cols-2 gap-px max-w-md rounded-xl overflow-hidden border border-white/10 text-center text-sm">
        <Cell label="True negatives" value={cells.tn} tone="neutral" />
        <Cell label="False positives" value={cells.fp} tone="warn" />
        <Cell label="False negatives (missed)" value={cells.fn} tone="bad" />
        <Cell label="True positives (caught)" value={cells.tp} tone="good" />
      </div>
      <p className="text-[11px] text-white/40 mt-2">Counts of {formatCount(testRows)} held-out test encounters.</p>
    </Panel>
  );
}

function Cell({ label, value, tone }: { label: string; value: number; tone: 'good' | 'bad' | 'warn' | 'neutral' }) {
  const tones = {
    good: 'bg-emerald-500/15 text-emerald-200',
    bad: 'bg-red-500/15 text-red-200',
    warn: 'bg-amber-500/10 text-amber-200',
    neutral: 'bg-white/5 text-white/70',
  } as const;
  return (
    <div className={`p-4 ${tones[tone]}`}>
      <p className="text-xl font-semibold">{formatCount(value)}</p>
      <p className="text-[10px] uppercase tracking-widest opacity-70">{label}</p>
    </div>
  );
}

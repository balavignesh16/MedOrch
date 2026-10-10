'use client';

import React, { useState } from 'react';
import type { ReadmissionFairness } from '@/lib/ml/modelArtifactTypes';
import { fairnessRows, formatDecimal, formatInterval, formatPercent, formatCount } from '@/lib/ml/modelArtifactViews';
import { Panel } from './Panel';

const TABS = [
  { key: 'race', label: 'Race' },
  { key: 'gender', label: 'Gender' },
  { key: 'age_band', label: 'Age band' },
] as const;

export function FairnessTable({ fairness }: { fairness: ReadmissionFairness }) {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('race');
  const attribute = fairness.attributes[tab];
  const rows = fairnessRows(attribute);

  return (
    <Panel
      title="Fairness audit by subgroup"
      subtitle={`Held-out test set at the operating threshold (${formatDecimal(fairness.operating_threshold)}). Gaps above ${fairness.gap_review_threshold.toFixed(
        2,
      )} are flagged for review. Groups with too few cases are suppressed (${fairness.suppression_rule}).`}
    >
      <div className="flex gap-2 mb-4">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              item.key === tab
                ? 'bg-brand-teal/20 border-brand-teal text-brand-teal'
                : 'bg-black/30 border-white/10 text-white/70 hover:border-brand-teal/40'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-white/40">
            <tr>
              {['Group', 'n', 'Prevalence', 'ROC-AUC (95% CI)', 'Recall', 'False-pos. rate', 'Calibration gap'].map((heading) => (
                <th key={heading} className="px-3 py-2 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.group} className="border-t border-white/5 text-white/80">
                <td className="px-3 py-2 font-medium">{row.group}</td>
                <td className="px-3 py-2 font-mono text-xs">{formatCount(row.n)}</td>
                <td className="px-3 py-2">{formatPercent(row.prevalence)}</td>
                {row.suppressed ? (
                  <td colSpan={4} className="px-3 py-2 text-xs text-white/40 italic">
                    Suppressed — too few cases to report with honest precision
                  </td>
                ) : (
                  <>
                    <td className="px-3 py-2">
                      {formatDecimal(row.rocAuc)} <span className="text-white/40 text-xs">({formatInterval(row.rocAucCi ?? undefined, 2)})</span>
                    </td>
                    <td className={`px-3 py-2 ${row.isRecallExtreme ? 'text-amber-300 font-semibold' : ''}`}>{formatPercent(row.recall)}</td>
                    <td className={`px-3 py-2 ${row.isFprExtreme ? 'text-amber-300 font-semibold' : ''}`}>{formatPercent(row.falsePositiveRate)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.calibrationGap === null ? 'n/a' : row.calibrationGap.toFixed(3)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-white/70">{attribute.interpretation}</p>
      <p className="mt-3 text-[11px] text-white/40">{fairness.caveat}</p>
    </Panel>
  );
}

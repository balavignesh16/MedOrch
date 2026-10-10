import React from 'react';
import Link from 'next/link';
import type { Finding, FindingSource, HeadlineKpis } from '@/lib/executiveSummary';
import { formatCount, formatPercent } from '@/lib/ml/modelArtifactViews';
import { Panel, Stat } from '@/components/model/Panel';
import { TargetsPanel, type TargetKpi } from './TargetsPanel';

const SOURCE_LINKS: Record<FindingSource, { href: string; label: string }> = {
  Model: { href: '/predictive', label: 'Predictive' },
  'HbA1c study': { href: '/research', label: 'Research' },
  Fairness: { href: '/predictive', label: 'Predictive' },
  Drivers: { href: '/predictive', label: 'Predictive' },
  'Data quality': { href: '/data-quality', label: 'Data Quality' },
  Operations: { href: '/operations', label: 'Operations' },
};

const SOURCE_ORDER: FindingSource[] = ['Model', 'Drivers', 'Fairness', 'HbA1c study', 'Operations', 'Data quality'];

export function ExecutiveSummaryView({ kpis, findings }: { kpis: HeadlineKpis; findings: Finding[] }) {
  const targetKpis: TargetKpi[] = [
    { key: 'thirtyDayRate', label: '30-day readmission rate', current: kpis.thirtyDayRate, unit: 'percent', direction: 'lower-is-better' },
    { key: 'anyReadmissionRate', label: 'Any readmission rate', current: kpis.anyReadmissionRate, unit: 'percent', direction: 'lower-is-better' },
    ...(kpis.meanLos === null
      ? []
      : [{ key: 'meanLos', label: 'Mean length of stay', current: kpis.meanLos, unit: 'days' as const, direction: 'lower-is-better' as const }]),
  ];
  const grouped = SOURCE_ORDER.map((source) => ({ source, items: findings.filter((f) => f.source === source) })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Stat label="Encounters" value={formatCount(kpis.encounters)} />
        <Stat label="Patients" value={formatCount(kpis.patients)} />
        <Stat label="30-day readmission" value={formatPercent(kpis.thirtyDayRate)} hint="readmitted = '<30'" />
        <Stat label="Any readmission" value={formatPercent(kpis.anyReadmissionRate)} hint="readmitted != 'NO'" />
        <Stat label="Mean length of stay" value={kpis.meanLos === null ? 'n/a' : `${kpis.meanLos.toFixed(1)} days`} />
        <Stat label="HbA1c tested" value={formatPercent(kpis.hba1cTestedShare)} hint="Share of encounters" />
      </div>

      <Panel
        title="Key findings"
        subtitle="Each finding is written by fixed rules from a saved result and links to the page where it can be inspected. If an input is missing, its finding is omitted rather than estimated."
      >
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.source}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] uppercase tracking-widest text-white/40">{group.source}</p>
                <Link href={SOURCE_LINKS[group.source].href} className="text-[11px] text-brand-teal hover:underline">
                  Open {SOURCE_LINKS[group.source].label}
                </Link>
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-white/80">
                {group.items.map((item) => (
                  <li key={item.text}>{item.text}</li>
                ))}
              </ul>
            </div>
          ))}
          {grouped.length === 0 && <p className="text-sm text-white/50">No saved results are available yet. See the regeneration order in engine/ml/README.md.</p>}
        </div>
      </Panel>

      <TargetsPanel kpis={targetKpis} />

      <p className="text-[11px] text-white/40">
        Not shown on purpose: ROI, cost savings, industry benchmarks, and forecasts. The data cannot support them. The
        what-if scenario calculator on the Predictive page is the only place for assumption-based numbers, and it labels them as such.
      </p>
    </div>
  );
}

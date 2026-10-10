'use client';

import React from 'react';
import { AskAboutButton } from '@/components/model/AskAboutButton';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MedicationAnalytics, RateRow } from '@/lib/ml/medicationAnalytics';
import { formatCount } from '@/lib/ml/modelArtifactViews';
import { CHART_TOOLTIP_STYLE, Panel } from '@/components/model/Panel';

interface ShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: { percent: number; lowPercent: number; highPercent: number };
}

function BarWithInterval(props: unknown) {
  const { x, y, width, height, payload } = props as ShapeProps;
  const scale = payload.percent > 0 ? height / payload.percent : 0;
  const centre = x + width / 2;
  const top = y - (payload.highPercent - payload.percent) * scale;
  const bottom = y + (payload.percent - payload.lowPercent) * scale;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} fill="#0f766e" />
      <g stroke="#f8fafc" strokeWidth={2.5} strokeLinecap="round">
        <line x1={centre} x2={centre} y1={top} y2={bottom} />
        <line x1={centre - 6} x2={centre + 6} y1={top} y2={top} />
        <line x1={centre - 6} x2={centre + 6} y1={bottom} y2={bottom} />
      </g>
    </g>
  );
}

function RateChart({ rows }: { rows: RateRow[] }) {
  const data = rows.map((row) => ({
    label: row.label,
    percent: row.rate * 100,
    lowPercent: row.ci95[0] * 100,
    highPercent: row.ci95[1] * 100,
    n: row.n,
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} interval={0} />
          <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} unit="%" domain={[0, 'auto']} />
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            formatter={(value, _name, item) => [
              `${Number(value).toFixed(1)}% (n=${formatCount((item.payload as { n: number }).n)})`,
              '30-day readmission',
            ]}
          />
          <Bar dataKey="percent" shape={BarWithInterval} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MedicationAnalyticsView({ analytics }: { analytics: MedicationAnalytics }) {
  const topDrugs = analytics.prevalence.slice(0, 12).map((drug) => ({
    drug: drug.drug.replace(/_/g, ' + '),
    steady: Number(((drug.steady / drug.total) * 100).toFixed(2)),
    up: Number(((drug.up / drug.total) * 100).toFixed(2)),
    down: Number(((drug.down / drug.total) * 100).toFixed(2)),
  }));

  return (
    <div className="space-y-4">
      <Panel
        title="Medication patterns and 30-day readmission"
        aside={<AskAboutButton prompt="Compare the 30-day readmission rate (readmitted = '<30') by insulin status" />}
        subtitle={`Across ${formatCount(analytics.totalEncounters)} encounters. Bars show 30-day readmission rates with 95% Wilson intervals; groups under 30 encounters are not shown. Associations only — sicker patients receive more medication changes.`}
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-white mb-2">By insulin status during the stay</p>
            <RateChart rows={analytics.insulinReadmission} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white mb-2">By number of medications with a dose change</p>
            <RateChart rows={analytics.medicationChangeReadmission} />
          </div>
        </div>
        {analytics.suppressed.length > 0 && (
          <p className="mt-3 text-[11px] text-white/40">Suppressed (too few encounters): {analytics.suppressed.join('; ')}.</p>
        )}
      </Panel>

      <Panel title="Most-prescribed diabetes drugs" subtitle="Share of encounters where each drug was given steadily, increased, or decreased (the remainder: not prescribed).">
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topDrugs} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" unit="%" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="drug" width={170} stroke="rgba(255,255,255,0.6)" fontSize={11} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value, name) => [`${value}%`, String(name)]} />
              <Bar dataKey="steady" name="Steady" stackId="a" fill="#14b8a6" isAnimationActive={false} />
              <Bar dataKey="up" name="Dose increased" stackId="a" fill="#f97316" isAnimationActive={false} />
              <Bar dataKey="down" name="Dose decreased" stackId="a" fill="#06b6d4" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

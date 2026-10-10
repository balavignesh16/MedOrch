'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OperationsData, RateSlice, Slice } from '@/lib/operationsData';
import { formatCount, formatPercent } from '@/lib/ml/modelArtifactViews';
import { CHART_TOOLTIP_STYLE, Panel, Stat } from '@/components/model/Panel';
import { AskAboutButton } from '@/components/model/AskAboutButton';

const AXIS = { stroke: 'rgba(255,255,255,0.45)', fontSize: 11, tickLine: false } as const;

interface RateShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: { percent: number; lowPercent: number; highPercent: number };
}

function BarWithInterval(props: unknown) {
  const { x, y, width, height, payload } = props as RateShapeProps;
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

function RateChart({ rows, shortLabels = false }: { rows: RateSlice[]; shortLabels?: boolean }) {
  const data = rows.map((row) => ({
    label: shortLabels ? row.label.split(' ')[0] : row.label.length > 26 ? `${row.label.slice(0, 24)}…` : row.label,
    fullLabel: row.label,
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
          <XAxis dataKey="label" {...AXIS} interval={0} />
          <YAxis {...AXIS} unit="%" domain={[0, 'auto']} />
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            labelFormatter={(_label, payload) => (payload?.[0]?.payload as { fullLabel?: string } | undefined)?.fullLabel ?? String(_label)}
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

function ShareChart({ rows, color = '#14b8a6' }: { rows: Slice[]; color?: string }) {
  const data = rows.slice(0, 8).map((row) => ({ label: row.label, percent: row.share * 100, n: row.n }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis type="number" unit="%" {...AXIS} />
          <YAxis type="category" dataKey="label" width={190} {...AXIS} stroke="rgba(255,255,255,0.65)" />
          <Tooltip
            {...CHART_TOOLTIP_STYLE}
            formatter={(value, _name, item) => [`${Number(value).toFixed(1)}% (n=${formatCount((item.payload as { n: number }).n)})`, 'Share of encounters']}
          />
          <Bar dataKey="percent" fill={color} radius={[0, 4, 4, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OperationsView({ data, findings }: { data: OperationsData; findings: string[] }) {
  if (data.empty) {
    return <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">No encounters match the current filters.</p>;
  }
  const { summary } = data;
  const maxDischargeRate = Math.max(0.01, ...data.discharge.map((row) => row.rate));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Encounters" value={formatCount(summary.encounters)} hint="Matching the current filters" />
        <Stat
          label="Length of stay"
          value={summary.meanLos === null ? 'n/a' : `${summary.meanLos.toFixed(1)} days`}
          hint={`Median ${summary.medianLos} · 90% within ${summary.p90Los} days`}
        />
        <Stat label="Emergency admissions" value={formatPercent(summary.emergencyAdmissionShare)} hint="Admission type = Emergency" />
        <Stat label="Discharged home" value={formatPercent(summary.dischargedHomeShare)} hint="Disposition = home" />
        <Stat label="30-day readmission" value={formatPercent(summary.thirtyDayRate)} hint="readmitted = '<30'" />
        <Stat label="Any readmission" value={formatPercent(summary.anyReadmissionRate)} hint="readmitted != 'NO' (the assistant's definition)" />
      </div>

      <Panel title="What the data shows" subtitle="Generated by fixed rules from the numbers on this page; nothing here is hand-written or given an invented score.">
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-white/80">
          {findings.map((finding) => (
            <li key={finding}>{finding}</li>
          ))}
        </ul>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel
          title="Admission mix"
          subtitle="How patients arrive: admission type, labelled from the dataset's code table."
          aside={<AskAboutButton prompt="How many encounters are there for each admission_type_id?" />}
        >
          <ShareChart rows={data.admissionTypes} />
        </Panel>
        <Panel title="Admission source" subtitle="Where patients were referred from.">
          <ShareChart rows={data.admissionSources} color="#06b6d4" />
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Length of stay" subtitle="Encounters by number of days in hospital (the data has no dates, so this is a distribution, not a trend).">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.losHistogram} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="days" {...AXIS} />
                <YAxis {...AXIS} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value) => [formatCount(Number(value)), 'Encounters']} labelFormatter={(days) => `${days} day${days === 1 ? '' : 's'}`} />
                <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Mean length of stay by admission type">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.losByAdmissionType} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" unit=" d" {...AXIS} />
                <YAxis type="category" dataKey="label" width={170} {...AXIS} stroke="rgba(255,255,255,0.65)" />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value) => [`${Number(value).toFixed(2)} days`, 'Mean stay']} />
                <Bar dataKey="meanLos" fill="#f97316" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel
        title="30-day readmission by discharge destination"
        subtitle="Intervals are 95% Wilson. Destinations with fewer than 30 encounters are not shown. Death and hospice discharges are excluded because those patients cannot be readmitted."
        aside={<AskAboutButton prompt="What is the 30-day readmission rate (readmitted = '<30') by discharge_disposition_id?" />}
      >
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                {['Destination', 'Encounters', 'Share', '30-day rate', '95% CI'].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.discharge.map((row) => (
                <tr key={row.label} className="border-t border-white/5 text-white/80">
                  <td className="px-3 py-2">{row.label}</td>
                  <td className="px-3 py-2">{formatCount(row.n)}</td>
                  <td className="px-3 py-2">{formatPercent(row.share)}</td>
                  <td className="px-3 py-2 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded bg-white/5">
                        <div className="h-2 rounded bg-brand-teal" style={{ width: `${Math.min(100, (row.rate / maxDischargeRate) * 100)}%` }} />
                      </div>
                      <span className="w-12 text-right">{formatPercent(row.rate)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-white/50 whitespace-nowrap">{formatPercent(row.ci95[0])} – {formatPercent(row.ci95[1])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {data.dischargeNotReadmittable.length > 0 && (
        <p className="text-[11px] text-white/40">
          Not eligible for readmission:{' '}
          {data.dischargeNotReadmittable.map((slice) => `${slice.label} (${formatCount(slice.n)})`).join('; ')}.
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Readmission by prior inpatient visits" subtitle="Prior inpatient visits (x axis) against 30-day readmission rate. Patients with more previous admissions return more often.">
          <RateChart rows={data.priorInpatient} shortLabels />
        </Panel>
        <Panel title="Readmission by prior emergency visits" subtitle="Prior emergency visits (x axis) against 30-day readmission rate.">
          <RateChart rows={data.priorEmergency} shortLabels />
        </Panel>
      </div>

      <Panel title="Resource intensity by admission type" subtitle="Average tests, procedures and medications per encounter. A workload measure, not a cost.">
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                {['Admission type', 'Encounters', 'Lab procedures', 'Procedures', 'Medications', 'Diagnoses'].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.resourceByAdmissionType.map((row) => (
                <tr key={row.label} className="border-t border-white/5 text-white/80">
                  <td className="px-3 py-2">{row.label}</td>
                  <td className="px-3 py-2">{formatCount(row.n)}</td>
                  <td className="px-3 py-2">{row.labs.toFixed(1)}</td>
                  <td className="px-3 py-2">{row.procedures.toFixed(2)}</td>
                  <td className="px-3 py-2">{row.medications.toFixed(1)}</td>
                  <td className="px-3 py-2">{row.diagnoses.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {data.suppressed.length > 0 && (
        <p className="text-[11px] text-white/40">Not shown (fewer than 30 encounters): {data.suppressed.join('; ')}.</p>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { AskAboutButton } from '@/components/model/AskAboutButton';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DataQualityProfile } from '@/lib/ml/dataQualityTypes';
import { missingnessBars, outcomeBars, repeatPatientBars } from '@/lib/ml/dataQualityViews';
import { formatCount } from '@/lib/ml/modelArtifactViews';
import { CHART_TOOLTIP_STYLE, Panel, Stat } from '@/components/model/Panel';

export function DataQualityView({ profile }: { profile: DataQualityProfile }) {
  const consistency = profile.database_consistency;
  const missing = missingnessBars(profile);
  const repeats = repeatPatientBars(profile);
  const outcomes = outcomeBars(profile);
  const repeat = profile.repeat_patients;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Encounters" value={formatCount(consistency.raw_rows)} hint="Rows in the source CSV" />
        <Stat label="Patients" value={formatCount(consistency.raw_patients)} hint={`${formatCount(repeat.patients_with_multiple_encounters)} have more than one encounter`} />
        <Stat
          label="CSV ↔ database"
          value={consistency.rows_match ? 'Match' : 'MISMATCH'}
          hint={`${formatCount(consistency.database_rows)} rows in medorch.db`}
        />
        <Stat label="Duplicate encounter IDs" value={formatCount(consistency.duplicate_encounter_ids_in_raw)} hint="In the raw file" />
      </div>

      <Panel
        title="Lineage: from raw file to answer"
        subtitle="Every analysis in this application can be traced along this path. The AI assistant and dashboards only ever read; scripts that write run offline."
      >
        <div className="flex flex-col lg:flex-row lg:flex-wrap gap-2 items-stretch">
          {profile.lineage.map((node, index) => (
            <React.Fragment key={node.id}>
              <div className="flex-1 min-w-[150px] rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-sm font-medium text-white">{node.label}</p>
                <p className="text-[11px] text-white/50 mt-1 leading-snug">{node.detail}</p>
              </div>
              {index < profile.lineage.length - 1 && <div className="hidden lg:flex items-center text-white/30">→</div>}
            </React.Fragment>
          ))}
        </div>
      </Panel>

      <Panel
        title="Missing data by column"
        subtitle="'?' in the source file is the missing marker. 'Not performed' (HbA1c, glucose serum) means the test was not ordered, which is information, not missingness. Columns marked 'excluded' did not enter the database."
      >
        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={missing} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} unit="%" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
              <YAxis
                type="category"
                dataKey="column"
                width={150}
                stroke="rgba(255,255,255,0.6)"
                fontSize={11}
                tickLine={false}
                tickFormatter={(value: string) => {
                  const row = missing.find((r) => r.column === value);
                  return row && !row.inDatabase ? `${value} (excluded)` : value;
                }}
              />
              <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value, name) => [`${Number(value).toFixed(2)}%`, String(name)]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="missingPercent" name="Missing ('?')" stackId="a" fill="#f97316" isAnimationActive={false} />
              <Bar dataKey="notPerformedPercent" name="Test not performed" stackId="a" fill="#06b6d4" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-4 space-y-1 text-xs text-white/60">
          {Object.entries(profile.excluded_columns).map(([column, reason]) => (
            <li key={column}>
              <span className="font-mono text-white/80">{column}</span> — {reason}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Repeat patients" subtitle={repeat.why_it_matters}>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repeats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} interval={0} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value) => [formatCount(Number(value)), 'Patients']} />
                <Bar dataKey="patients" fill="#14b8a6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-white/50">
            {formatCount(repeat.encounters_from_repeat_patients)} encounters come from repeat patients; one patient has {repeat.max_encounters_for_one_patient}.
          </p>
        </Panel>

        <Panel title="Outcome balance" aside={<AskAboutButton prompt="How many encounters are in each readmitted category?" />} subtitle="The three values of the readmitted field. The classes are imbalanced, which is why accuracy is a poor metric here.">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outcomes} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value, _name, item) => [`${formatCount(Number(value))} (${(item.payload as { percent: number }).percent}%)`, 'Encounters']} />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel
        title="How “readmission” is defined in each part of the app"
        subtitle="Two definitions are in use. Stating which one applies prevents the apparent contradictions between assistant answers and model/research results."
      >
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-3 py-2 font-medium">Term</th>
                <th className="px-3 py-2 font-medium">Definition</th>
                <th className="px-3 py-2 font-medium">Used in</th>
              </tr>
            </thead>
            <tbody>
              {profile.definitions.map((row) => (
                <tr key={row.term} className="border-t border-white/5 text-white/80 align-top">
                  <td className="px-3 py-2 font-medium">{row.term}</td>
                  <td className="px-3 py-2">{row.definition}</td>
                  <td className="px-3 py-2 text-white/60">{row.used_in}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Cohort exclusions"
        subtitle={`${formatCount(profile.cohort_exclusions.total_excluded)} encounters end in death or hospice discharge and cannot be readmitted, so the model and the HbA1c study exclude them.`}
      >
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Reason</th>
                <th className="px-3 py-2 font-medium">Encounters</th>
              </tr>
            </thead>
            <tbody>
              {profile.cohort_exclusions.codes.map((row) => (
                <tr key={row.code} className="border-t border-white/5 text-white/80">
                  <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                  <td className="px-3 py-2">{row.description || '—'}</td>
                  <td className="px-3 py-2 capitalize">{row.reason}</td>
                  <td className="px-3 py-2">{formatCount(row.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

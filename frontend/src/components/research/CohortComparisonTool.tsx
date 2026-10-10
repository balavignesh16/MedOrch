'use client';

import React, { useState } from 'react';
import type { ComparisonResult, OutcomeKey } from '@/lib/analytics/cohortComparison';
import { formatCount, formatPercent } from '@/lib/ml/modelArtifactViews';
import { Panel, Stat } from '@/components/model/Panel';

type FilterKey = 'gender' | 'age' | 'race' | 'los' | 'medCount';
type CohortFilters = Partial<Record<FilterKey, string>>;

const FILTER_OPTIONS: Record<FilterKey, { label: string; values: string[] }> = {
  gender: { label: 'Gender', values: ['Female', 'Male'] },
  age: {
    label: 'Age',
    values: ['[0-10)', '[10-20)', '[20-30)', '[30-40)', '[40-50)', '[50-60)', '[60-70)', '[70-80)', '[80-90)', '[90-100)'],
  },
  race: { label: 'Race', values: ['Caucasian', 'AfricanAmerican', 'Hispanic', 'Asian', 'Other'] },
  los: { label: 'Length of stay (days)', values: ['0-3', '4-7', '8+'] },
  medCount: { label: 'Medications', values: ['0-10', '11-20', '20+'] },
};

const OUTCOMES: Array<{ key: OutcomeKey; label: string }> = [
  { key: 'readmitted_30', label: 'Readmitted within 30 days (rate)' },
  { key: 'time_in_hospital', label: 'Days in hospital (mean)' },
  { key: 'num_medications', label: 'Number of medications (mean)' },
  { key: 'number_inpatient', label: 'Prior inpatient visits (mean)' },
];

const PRESETS: Array<{ name: string; a: CohortFilters; b: CohortFilters; outcome: OutcomeKey }> = [
  { name: 'Women vs. men: readmission', a: { gender: 'Female' }, b: { gender: 'Male' }, outcome: 'readmitted_30' },
  { name: 'Age 80–90 vs. 50–60: readmission', a: { age: '[80-90)' }, b: { age: '[50-60)' }, outcome: 'readmitted_30' },
  { name: 'Long vs. short stays: medications', a: { los: '8+' }, b: { los: '0-3' }, outcome: 'num_medications' },
];

function CohortPicker({ title, value, onChange }: { title: string; value: CohortFilters; onChange: (next: CohortFilters) => void }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs font-semibold text-white mb-3">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(FILTER_OPTIONS) as FilterKey[]).map((key) => (
          <label key={key} className="text-[11px] text-white/50">
            {FILTER_OPTIONS[key].label}
            <select
              value={value[key] ?? ''}
              onChange={(event) => {
                const next = { ...value };
                if (event.target.value) next[key] = event.target.value;
                else delete next[key];
                onChange(next);
              }}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-2 py-1.5 text-sm text-white"
            >
              <option value="">Any</option>
              {FILTER_OPTIONS[key].values.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}

export function CohortComparisonTool() {
  const [cohortA, setCohortA] = useState<CohortFilters>({ gender: 'Female' });
  const [cohortB, setCohortB] = useState<CohortFilters>({ gender: 'Male' });
  const [outcome, setOutcome] = useState<OutcomeKey>('readmitted_30');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/research/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohortA, cohortB, outcome }),
      });
      const body = await response.json();
      if (!response.ok) {
        setResult(null);
        setError(body?.error?.message ?? 'The comparison could not be completed.');
      } else {
        setResult(body as ComparisonResult);
      }
    } catch {
      setResult(null);
      setError('The comparison service is unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel
      title="Compare two cohorts"
      subtitle="Define two groups and an outcome; the test is chosen from the data (Fisher's exact test if counts are small, otherwise chi-square; Welch's t and Mann–Whitney for numeric outcomes)."
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-[10px] uppercase tracking-widest text-white/40 self-center mr-1">Examples</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => { setCohortA(preset.a); setCohortB(preset.b); setOutcome(preset.outcome); setResult(null); }}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/30 text-xs text-white/70 hover:border-brand-teal/40"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CohortPicker title="Cohort A" value={cohortA} onChange={setCohortA} />
        <CohortPicker title="Cohort B" value={cohortB} onChange={setCohortB} />
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-white">Outcome</p>
          <select
            value={outcome}
            onChange={(event) => setOutcome(event.target.value as OutcomeKey)}
            className="w-full rounded-lg border border-white/10 bg-black/60 px-2 py-1.5 text-sm text-white"
          >
            {OUTCOMES.map((item) => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </select>
          <button
            onClick={run}
            disabled={loading}
            className="mt-auto rounded-xl bg-brand-teal/20 border border-brand-teal text-brand-teal text-sm font-medium py-2 disabled:opacity-50"
          >
            {loading ? 'Running…' : 'Run comparison'}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      {result && (
        <div className="mt-6 space-y-4">
          {result.warnings.length > 0 && (
            <ul className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 space-y-1">
              {result.warnings.map((warning) => (
                <li key={warning}>⚠ {warning}</li>
              ))}
            </ul>
          )}

          {result.kind === 'binary' ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat label="Cohort A" value={formatPercent(result.a.rate)} hint={`${formatCount(result.a.events)} of ${formatCount(result.a.n)} · CI ${formatPercent(result.a.rateCi95[0])}–${formatPercent(result.a.rateCi95[1])}`} />
              <Stat label="Cohort B" value={formatPercent(result.b.rate)} hint={`${formatCount(result.b.events)} of ${formatCount(result.b.n)} · CI ${formatPercent(result.b.rateCi95[0])}–${formatPercent(result.b.rateCi95[1])}`} />
              <Stat label="Odds ratio (A vs B)" value={result.oddsRatio.value.toFixed(2)} hint={`95% CI ${result.oddsRatio.ci95[0].toFixed(2)}–${result.oddsRatio.ci95[1].toFixed(2)}${result.oddsRatio.continuityAdjusted ? ' (0.5 added to cells)' : ''}`} />
              <Stat label={result.test.name === 'fisher-exact' ? "Fisher's exact p" : 'Chi-square p'} value={result.test.pValue < 0.001 ? '< 0.001' : result.test.pValue.toFixed(3)} hint={result.test.reason} />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat label="Cohort A" value={result.a.mean.toFixed(2)} hint={`SD ${result.a.sd.toFixed(2)} · median ${result.a.median} · n=${formatCount(result.a.n)}`} />
              <Stat label="Cohort B" value={result.b.mean.toFixed(2)} hint={`SD ${result.b.sd.toFixed(2)} · median ${result.b.median} · n=${formatCount(result.b.n)}`} />
              <Stat label="Welch's t-test p" value={result.welch.pValue < 0.001 ? '< 0.001' : result.welch.pValue.toFixed(3)} hint={`t = ${result.welch.t.toFixed(2)}, df = ${result.welch.degreesOfFreedom.toFixed(0)}`} />
              <Stat label="Mann–Whitney p" value={result.mannWhitney.pValue < 0.001 ? '< 0.001' : result.mannWhitney.pValue.toFixed(3)} hint="Rank-based; robust to skew" />
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-sm text-white/85">{result.interpretation}</p>
            <p className="mt-2 text-xs text-white/50">
              Effect size: <span className="text-white">{result.effectSize}</span> (
              {result.kind === 'binary' ? `Cohen's h = ${result.cohensH.toFixed(2)}` : `Cohen's d = ${result.cohensD.toFixed(2)}`})
            </p>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[11px] text-white/45">
            {result.caveats.map((caveat) => (
              <li key={caveat}>{caveat}</li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

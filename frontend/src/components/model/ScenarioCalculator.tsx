'use client';

import React, { useState } from 'react';
import type { ScenarioResult } from '@/lib/ml/scenario';
import { formatCount, formatPercent } from '@/lib/ml/modelArtifactViews';
import { Panel, Stat } from './Panel';

const currency = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

interface ScenarioCalculatorProps {
  heldOutTopDecileRecall?: number;
}

export function ScenarioCalculator({ heldOutTopDecileRecall }: ScenarioCalculatorProps) {
  const [capacity, setCapacity] = useState('10');
  const [reduction, setReduction] = useState('0');
  const [readmissionCost, setReadmissionCost] = useState('');
  const [interventionCost, setInterventionCost] = useState('');
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/predictive/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capacityPercent: capacity,
          assumedReductionPercent: reduction,
          costPerReadmission: readmissionCost,
          costPerIntervention: interventionCost,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setResult(null);
        setError(body?.error?.message ?? 'The scenario could not be calculated.');
      } else {
        setResult(body as ScenarioResult);
      }
    } catch {
      setResult(null);
      setError('The scenario service is unreachable.');
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, value: string, onChange: (next: string) => void, hint: string, placeholder?: string) => (
    <label className="text-[11px] text-white/50">
      {label}
      <input
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-2 py-1.5 text-sm text-white placeholder-white/25"
      />
      <span className="block mt-1 text-[10px] text-white/35">{hint}</span>
    </label>
  );

  return (
    <Panel
      title="Intervention scenario calculator"
      subtitle="If a care-management program could follow up the highest-risk patients, how many actual readmissions would it reach? Everything it claims to prevent depends on an assumption you enter — there is no built-in effect."
      aside={<span className="text-[10px] uppercase tracking-widest rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 px-3 py-1">Scenario — not a forecast</span>}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {field('Program capacity (% of encounters)', capacity, setCapacity, 'Highest-risk share followed up (1–50)')}
        {field('Assumed reduction in readmission (%)', reduction, setReduction, 'Your assumption, e.g. from published trials. 0 = no effect.')}
        {field('Cost per readmission (optional)', readmissionCost, setReadmissionCost, 'Leave blank to show no savings', '$')}
        {field('Cost per follow-up (optional)', interventionCost, setInterventionCost, 'Leave blank to show no program cost', '$')}
      </div>
      <button
        onClick={run}
        disabled={loading}
        className="mt-4 rounded-xl bg-brand-teal/20 border border-brand-teal text-brand-teal text-sm font-medium px-5 py-2 disabled:opacity-50"
      >
        {loading ? 'Calculating…' : 'Calculate scenario'}
      </button>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Encounters followed up" value={formatCount(result.targeted)} hint={`of ${formatCount(result.scoredEncounters)} scored`} />
            <Stat label="Actual readmissions reached" value={formatCount(result.caughtReadmissions)} hint={`${formatPercent(result.captureRate)} of ${formatCount(result.totalReadmissions)} · counted from data`} />
            <Stat label="Precision at this capacity" value={formatPercent(result.precisionAtCapacity)} hint={`vs. ${formatPercent(result.prevalence)} if chosen at random (${result.lift.toFixed(1)}× lift)`} />
            <Stat label="Scenario readmissions averted" value={result.scenarioAverted.toFixed(1)} hint="Reached × your assumed reduction" />
          </div>

          {(result.interventionCost !== null || result.scenarioSavings !== null) && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {result.interventionCost !== null && <Stat label="Scenario program cost" value={currency(result.interventionCost)} />}
              {result.scenarioSavings !== null && <Stat label="Scenario savings" value={currency(result.scenarioSavings)} />}
              {result.scenarioNet !== null && <Stat label="Scenario net" value={currency(result.scenarioNet)} hint="Savings minus cost" />}
            </div>
          )}

          <p className="text-sm font-medium text-amber-300">{result.label}</p>
          {heldOutTopDecileRecall !== undefined && (
            <p className="text-xs text-white/50">
              Reference: on held-out data, flagging the top 10% reached {formatPercent(heldOutTopDecileRecall)} of readmissions. Figures above use all
              scored encounters, including ones the model trained on, so they run higher.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-white/55">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Formula</p>
              <ul className="list-disc pl-5 space-y-1">{result.formula.map((line) => <li key={line}>{line}</li>)}</ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Assumptions</p>
              <ul className="list-disc pl-5 space-y-1">{result.assumptions.map((line) => <li key={line}>{line}</li>)}</ul>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

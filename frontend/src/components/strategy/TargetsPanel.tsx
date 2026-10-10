'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { evaluateTarget, type TargetDirection } from '@/lib/executiveSummary';
import { Panel } from '@/components/model/Panel';

export interface TargetKpi {
  key: string;
  label: string;
  current: number;
  /** Display unit: percent values are shown x100. */
  unit: 'percent' | 'days';
  direction: TargetDirection;
}

const STORAGE_KEY = 'medorch_user_targets_v1';
const CHANGE_EVENT = 'medorch-targets-changed';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readStored(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function parseTargets(raw: string): Record<string, string> {
  try {
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function display(value: number, unit: TargetKpi['unit']): string {
  return unit === 'percent' ? `${(value * 100).toFixed(1)}%` : `${value.toFixed(1)} days`;
}

export function TargetsPanel({ kpis }: { kpis: TargetKpi[] }) {
  const stored = useSyncExternalStore(subscribe, readStored, () => '');
  // Only used when storage is unavailable, so targets still work for this visit.
  const [memory, setMemory] = useState<Record<string, string> | null>(null);
  const targets = useMemo(() => memory ?? parseTargets(stored), [memory, stored]);

  const update = (key: string, value: string) => {
    const next = { ...targets, [key]: value };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      setMemory(next);
    }
  };

  return (
    <Panel
      title="Your targets"
      subtitle="Enter a target for each measure to see the gap. These are your own figures, stored only in this browser — the application supplies no benchmark or industry target."
    >
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-white/40">
            <tr>
              {['Measure', 'Current (from the data)', 'Your target', 'Gap'].map((heading) => (
                <th key={heading} className="px-3 py-2 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kpis.map((kpi) => {
              // Percent targets are typed as percentages (e.g. 10) but compared as fractions.
              const typed = targets[kpi.key] ?? '';
              const asNumber = Number(typed);
              const comparable = kpi.unit === 'percent' && typed.trim() !== '' && Number.isFinite(asNumber) ? String(asNumber / 100) : typed;
              const result = evaluateTarget(kpi.current, comparable, kpi.direction);
              return (
                <tr key={kpi.key} className="border-t border-white/5 text-white/80">
                  <td className="px-3 py-2 font-medium">{kpi.label}</td>
                  <td className="px-3 py-2">{display(kpi.current, kpi.unit)}</td>
                  <td className="px-3 py-2">
                    <input
                      inputMode="decimal"
                      value={typed}
                      placeholder={kpi.unit === 'percent' ? 'e.g. 10 (%)' : 'e.g. 4 (days)'}
                      onChange={(event) => update(kpi.key, event.target.value)}
                      className="w-32 rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-sm text-white placeholder-white/25"
                      aria-label={`Target for ${kpi.label}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {result.status === 'no-target' ? (
                      <span className="text-white/35">Enter a target</span>
                    ) : (
                      <span className={result.status === 'meets' ? 'text-emerald-300' : 'text-amber-300'}>
                        {result.status === 'meets' ? 'Meets target' : 'Above target'}{' '}
                        ({result.gap! >= 0 ? '+' : ''}
                        {kpi.unit === 'percent' ? `${(result.gap! * 100).toFixed(1)} points` : `${result.gap!.toFixed(1)} days`})
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

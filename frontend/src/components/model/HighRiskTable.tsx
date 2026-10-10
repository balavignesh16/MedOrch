'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { HighRiskEncounter } from '@/lib/ml/predictiveData';
import { formatPercent, humanizeFeature } from '@/lib/ml/modelArtifactViews';
import { Panel } from './Panel';

export function HighRiskTable({ encounters }: { encounters: HighRiskEncounter[] }) {
  const [openRank, setOpenRank] = useState<number | null>(null);

  if (encounters.length === 0) {
    return (
      <Panel title="Highest-risk encounters">
        <p className="text-sm text-white/60">
          No scored encounters yet. Run <code className="font-mono text-xs">python -m engine.ml.apply_predictions</code>.
        </p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Highest-risk encounters"
      subtitle="Top encounters by predicted risk. Shown de-identified — no encounter or patient identifiers leave the server, so the rank is the only key. Click a row for the model's top reasons (SHAP, log-odds scale)."
    >
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-white/40">
            <tr>
              {['#', 'Risk', 'Age', 'Gender', 'Race', 'Days', 'Prior inpatient', 'Meds', ''].map((heading) => (
                <th key={heading} className="px-3 py-2 font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {encounters.map((row) => {
              const isOpen = openRank === row.rank;
              return (
                <React.Fragment key={row.rank}>
                  <tr
                    onClick={() => setOpenRank(isOpen ? null : row.rank)}
                    className="border-t border-white/5 text-white/80 hover:bg-white/5 cursor-pointer"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-white/50">{row.rank}</td>
                    <td className="px-3 py-2 font-semibold text-brand-orange">{formatPercent(row.riskScore)}</td>
                    <td className="px-3 py-2">{row.age ?? 'n/a'}</td>
                    <td className="px-3 py-2">{row.gender ?? 'n/a'}</td>
                    <td className="px-3 py-2">{row.race ?? 'Unknown'}</td>
                    <td className="px-3 py-2">{row.daysInHospital ?? 'n/a'}</td>
                    <td className="px-3 py-2">{row.priorInpatientVisits ?? 'n/a'}</td>
                    <td className="px-3 py-2">{row.medications ?? 'n/a'}</td>
                    <td className="px-3 py-2 text-white/40">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-black/40">
                      <td colSpan={9} className="px-4 py-3">
                        {row.drivers.length === 0 ? (
                          <p className="text-xs text-white/50">
                            No explanation stored for this encounter (explanations are generated for the highest-risk
                            encounters by <code className="font-mono">python -m engine.ml.explain_model</code>).
                          </p>
                        ) : (
                          <ul className="space-y-1 text-xs">
                            {row.drivers.map((driver) => (
                              <li key={driver.feature} className="flex items-center gap-3">
                                <span className={`w-14 font-mono ${driver.contribution >= 0 ? 'text-brand-orange' : 'text-brand-cyan'}`}>
                                  {driver.contribution >= 0 ? '+' : ''}
                                  {driver.contribution.toFixed(2)}
                                </span>
                                <span className="text-white/80">
                                  {humanizeFeature(driver.feature)} = <span className="text-white">{driver.value}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

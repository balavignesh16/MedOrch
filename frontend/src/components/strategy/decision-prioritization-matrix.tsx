import React from 'react';
import { BarChart2 } from 'lucide-react';

interface DecisionPrioritizationMatrixProps {
  data: any[];
}

export function DecisionPrioritizationMatrix({ data }: DecisionPrioritizationMatrixProps) {
  return (
    <div className="bg-surface-glass border border-border-glass rounded-2xl p-6 shadow-2xl overflow-hidden h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-white flex items-center">
          <BarChart2 className="w-5 h-5 mr-2 text-brand-teal" />
          Decision Prioritization Matrix
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Initiative</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Impact</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Cost</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Risk</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Effort</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">ROI</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Time to Benefit</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.sort((a, b) => b.score - a.score).map((row, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="py-4 px-4">
                  <span className="text-sm font-bold text-white">{row.initiative}</span>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                    ${row.impact.includes('High') ? 'bg-success/10 text-success border border-success/20' : 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20'}`}>
                    {row.impact}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-mono text-warning">{row.cost}</span>
                </td>
                <td className="py-4 px-4">
                  <span className={`text-sm ${row.risk === 'High' ? 'text-danger' : row.risk === 'Low' ? 'text-success' : 'text-warning'}`}>
                    {row.risk}
                  </span>
                </td>
                <td className="py-4 px-4">
                   <span className="text-sm text-white/80">{row.effort}</span>
                </td>
                <td className="py-4 px-4">
                   <span className="text-sm font-bold text-success">{row.roi}</span>
                </td>
                <td className="py-4 px-4">
                   <span className="text-sm text-white/70">{row.timeToBenefit}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-surface-black rounded-full h-1.5 min-w-[50px]">
                      <div className="bg-brand-teal h-1.5 rounded-full" style={{ width: `${row.score}%` }}></div>
                    </div>
                    <span className="text-sm font-mono text-white">{row.score}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

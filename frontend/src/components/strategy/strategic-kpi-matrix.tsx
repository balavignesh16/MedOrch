import React from 'react';
import type { fetchStrategicKpiMatrix } from '@/lib/strategyLogic';
import { ActivitySquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StrategicKpiMatrixProps {
  data: Awaited<ReturnType<typeof fetchStrategicKpiMatrix>>;
}

export function StrategicKpiMatrix({ data }: StrategicKpiMatrixProps) {
  return (
    <div className="bg-surface-glass border border-border-glass rounded-2xl p-6 shadow-2xl overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-white flex items-center">
          <ActivitySquare className="w-5 h-5 mr-2 text-brand-teal" />
          Strategic KPI Matrix
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Domain</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">KPI</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Current</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Target</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Variance</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="py-4 px-4">
                  <span className="text-sm font-medium text-white/80">{row.domain}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-bold text-white">{row.kpi}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-white/90 font-mono">{row.current}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-brand-cyan font-mono">{row.target}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {row.trend === 'up' && row.status === 'Critical' ? <TrendingUp className="w-4 h-4 text-danger" /> :
                     row.trend === 'up' && row.status !== 'Critical' ? <TrendingUp className="w-4 h-4 text-success" /> :
                     row.trend === 'down' && row.status === 'Watch' ? <TrendingDown className="w-4 h-4 text-warning" /> :
                     row.trend === 'down' && row.status === 'Good' ? <TrendingDown className="w-4 h-4 text-success" /> :
                     <Minus className="w-4 h-4 text-white/50" />}
                    <span className={`text-sm font-mono ${row.status === 'Critical' ? 'text-danger' : row.status === 'Good' || row.status === 'Excellent' ? 'text-success' : 'text-warning'}`}>
                      {row.variance > 0 ? `+${row.variance}` : row.variance}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                    ${row.status === 'Excellent' ? 'bg-success/10 text-success border border-success/20' :
                      row.status === 'Good' ? 'bg-brand-teal/10 text-brand-teal border border-brand-teal/20' :
                      row.status === 'Watch' ? 'bg-warning/10 text-warning border border-warning/20' :
                      'bg-danger/10 text-danger border border-danger/20'}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

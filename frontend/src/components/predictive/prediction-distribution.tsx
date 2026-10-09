import React from 'react';
import type { fetchPredictionDistribution } from '@/lib/predictiveLogic';

interface PredictionDistributionProps {
  distribution: Awaited<ReturnType<typeof fetchPredictionDistribution>>;
}

export const PredictionDistribution: React.FC<PredictionDistributionProps> = ({ distribution }) => {
  const max = Math.max(...distribution.map(d => d.count));
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
      <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Prediction Risk Distribution</h3>
      <div className="space-y-4">
        {distribution.map((d, i) => (
          <div key={i} className="flex flex-col text-xs">
            <div className="flex justify-between mb-1">
              <span className="text-white/80 font-medium">{d.level}</span>
              <span className="text-white font-mono">{d.count.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-900 overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  d.level === 'Critical Risk' ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                  d.level === 'High Risk' ? 'bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                  d.level === 'Medium Risk' ? 'bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' :
                  'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                }`}
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

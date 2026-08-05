import React from 'react';

export const FeatureImportanceChart: React.FC = () => {
  const features = [
    { name: 'Age', importance: 0.35 },
    { name: 'Previous Readmission', importance: 0.28 },
    { name: 'Comorbidities (Count)', importance: 0.22 },
    { name: 'Emergency Visits (L30D)', importance: 0.18 },
    { name: 'Polypharmacy', importance: 0.15 },
    { name: 'Surgical Complexity', importance: 0.12 },
    { name: 'Social Determinants Risk', importance: 0.08 }
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
      <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Global Feature Importance</h3>
      <div className="space-y-4">
        {features.map((f, i) => (
          <div key={i} className="flex items-center text-xs group">
            <div className="w-40 text-brand-gray truncate pr-2 group-hover:text-white transition-colors">{f.name}</div>
            <div className="flex-1 flex items-center">
              <div className="flex-1 h-2 rounded-full bg-slate-900 overflow-hidden shadow-inner">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-brand-teal to-brand-cyan shadow-[0_0_8px_rgba(34,211,238,0.5)] transition-all duration-1000"
                  style={{ width: `${f.importance * 100}%` }}
                />
              </div>
              <span className="ml-3 text-white/90 font-mono w-10 text-right group-hover:text-brand-cyan transition-colors">{(f.importance * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

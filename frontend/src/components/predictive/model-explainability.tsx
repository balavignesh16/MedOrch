import React from 'react';
import { BrainCircuit } from 'lucide-react';

interface ModelExplainabilityProps {
  metadata: any;
  explainability: any;
}

export const ModelExplainability: React.FC<ModelExplainabilityProps> = ({ metadata, explainability }) => {
  if (!explainability) return null;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:border-brand-purple/50 transition-colors duration-500">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-purple via-brand-cyan to-brand-blue opacity-80"></div>
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-base font-semibold text-white flex items-center">
          <BrainCircuit className="text-brand-purple w-5 h-5 mr-2" />
          Model Explainability
        </h3>
        <div className="text-xs px-3 py-1 rounded-full border bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan shadow-[0_0_10px_rgba(34,211,238,0.2)]">
          Confidence: {explainability.confidence}%
        </div>
      </div>

      <div className="mb-6 bg-slate-900/50 p-4 rounded-xl border border-white/5">
        <p className="text-xs text-white/80 font-medium mb-1">
          {metadata?.name || 'Unknown'} (v{metadata?.version || '1.0'})
        </p>
        <p className="text-xs text-brand-gray">
          {explainability.reasoning || 'Standard baseline prediction.'}
        </p>
      </div>

      <h4 className="text-[11px] uppercase tracking-wider font-semibold text-white/70 mb-4">Top Drivers</h4>
      <div className="space-y-4">
        {explainability.drivers?.map((driver: any, i: number) => (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/90">{driver.factor}</span>
              <span className="text-brand-cyan font-mono">{driver.impact}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand-cyan to-brand-purple rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                style={{ width: `${driver.impact}%` }}
              />
            </div>
          </div>
        )) || (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/90">Baseline Risk</span>
              <span className="text-brand-cyan font-mono">100%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-cyan to-brand-purple rounded-full w-full" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 flex justify-between text-[10px] text-brand-gray uppercase tracking-widest">
        <span>Trained: {metadata?.trainingDate || 'Unknown'}</span>
        <span>Type: {metadata?.outputType || 'Continuous'}</span>
      </div>
    </div>
  );
};

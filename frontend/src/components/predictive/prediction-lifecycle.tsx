import React from 'react';
import { Workflow, Database, Cog, Cpu, BrainCircuit, Stethoscope } from 'lucide-react';

export const PredictionLifecycle: React.FC = () => {
  const stages = [
    { label: 'Dataset Integration', icon: <Database className="text-brand-cyan w-4 h-4" />, desc: 'FHIR Data ingested' },
    { label: 'Feature Engineering', icon: <Cog className="text-brand-cyan w-4 h-4" />, desc: '142 features extracted' },
    { label: 'Prediction Model', icon: <Cpu className="text-brand-cyan w-4 h-4" />, desc: 'XGBoost v1.4.2' },
    { label: 'Explainability', icon: <BrainCircuit className="text-brand-cyan w-4 h-4" />, desc: 'SHAP values applied' },
    { label: 'Clinical Intervention', icon: <Stethoscope className="text-brand-cyan w-4 h-4" />, desc: 'Actionable queue updated' }
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal via-brand-cyan to-brand-blue"></div>
      <h3 className="text-base font-semibold text-white mb-6 flex items-center">
        <Workflow className="text-brand-cyan w-5 h-5 mr-2" />
        AI Prediction Lifecycle
      </h3>
      <div className="flex flex-col relative">
        {/* Vertical Line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-brand-cyan/50 to-transparent"></div>
        {stages.map((stage, i) => (
          <div key={i} className="flex items-start mb-6 last:mb-0 relative z-10 group">
            <div className="w-10 h-10 rounded-full bg-slate-900/80 border border-white/20 flex items-center justify-center shrink-0 shadow-lg group-hover:border-brand-cyan group-hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300">
              {stage.icon}
            </div>
            <div className="ml-4 pt-1">
              <div className="text-sm font-medium text-white group-hover:text-brand-cyan transition-colors">{stage.label}</div>
              <div className="text-xs text-white/50 mt-0.5">{stage.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

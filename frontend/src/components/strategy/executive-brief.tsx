import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { StrategicInsight } from '@/lib/analytics/types';

interface ExecutiveBriefProps {
  insights: StrategicInsight[];
}

export function ExecutiveBrief({ insights }: ExecutiveBriefProps) {
  return (
    <div className="bg-surface-glass border border-border-glass rounded-2xl p-6 shadow-2xl mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-white flex items-center">
          <FileText className="w-5 h-5 mr-2 text-brand-teal" />
          Board-Level Executive Brief
        </h3>
        <span className="text-[10px] uppercase tracking-wider font-bold text-brand-teal bg-brand-teal/10 px-2 py-1 rounded-full">
          Deterministic Rule Engine
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {insights.map((insight, idx) => (
          <div key={idx} className="bg-slate-900/50 border border-white/5 rounded-xl p-5 hover:bg-white/5 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-base font-bold text-white">{insight.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                    ${insight.priority === 'Immediate' ? 'bg-danger/20 text-danger' : 
                      insight.priority === 'Short Term' ? 'bg-warning/20 text-warning' : 
                      'bg-brand-cyan/20 text-brand-cyan'}`}>
                    {insight.priority}
                  </span>
                </div>
                <p className="text-sm text-brand-teal font-medium mb-3">Action: <span className="text-white/80 font-normal">{insight.recommendedAction}</span></p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                   <div className="flex flex-col">
                     <span className="text-white/40 uppercase tracking-wider mb-1">Supporting KPI</span>
                     <span className="text-white font-mono">{insight.supportingKpi}</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-white/40 uppercase tracking-wider mb-1">Expected Impact</span>
                     <span className="text-success font-medium">{insight.expectedImpact}</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-white/40 uppercase tracking-wider mb-1">Module</span>
                     <span className="text-white/70">{insight.relatedModule}</span>
                   </div>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-center gap-1 text-xs text-brand-cyan mb-2">
                   <CheckCircle2 className="w-3.5 h-3.5" />
                   {insight.confidence}% Confidence
                </div>
                <span className="text-xs text-white/50">
                  Timeframe: <strong className="text-white/90">{insight.timeframe}</strong>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

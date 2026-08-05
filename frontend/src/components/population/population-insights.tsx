import React from 'react';
import { AlertCircle, CheckCircle, Info, Flame, Clock, Link as LinkIcon, Activity } from 'lucide-react';
import Link from 'next/link';

interface InsightData {
  title: string;
  severity: 'Positive' | 'Warning' | 'Critical' | 'Info' | string;
  confidence: number;
  supportingMetric: string;
  affectedPopulation: string;
  recommendedAction: string;
  relatedDashboard: string;
  timestamp: string;
}

interface PopulationInsightsProps {
  insights: InsightData[];
}

export function PopulationInsights({ insights }: PopulationInsightsProps) {
  if (!insights || insights.length === 0) return null;

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return { icon: <Flame className="h-5 w-5 text-danger" />, border: 'border-danger/30', bg: 'bg-danger/5' };
      case 'Warning':
        return { icon: <AlertCircle className="h-5 w-5 text-warning" />, border: 'border-warning/30', bg: 'bg-warning/5' };
      case 'Positive':
        return { icon: <CheckCircle className="h-5 w-5 text-success" />, border: 'border-success/30', bg: 'bg-success/5' };
      default:
        return { icon: <Info className="h-5 w-5 text-brand-cyan" />, border: 'border-brand-cyan/30', bg: 'bg-brand-cyan/5' };
    }
  };

  return (
    <div className="bg-surface-obsidian border border-border-glass rounded-xl p-4" role="region" aria-label="Population Insights Engine" tabIndex={0}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-cyan" /> 
          Population Insights
        </h3>
        <span className="text-[10px] uppercase tracking-wider font-bold text-brand-cyan bg-brand-cyan/10 px-2 py-1 rounded-full">
          Rule Engine
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {insights.map((insight, idx) => {
          const styles = getSeverityStyles(insight.severity);
          return (
            <div key={idx} className={`relative p-4 rounded-lg border ${styles.border} ${styles.bg} transition-all hover:bg-white/5 focus-within:bg-white/5`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5" aria-hidden="true">{styles.icon}</div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white/90">{insight.title}</h4>
                      <span className="inline-flex items-center gap-1 text-[10px] text-white/50 mt-1 uppercase tracking-wider font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${insight.severity === 'Critical' ? 'bg-danger' : insight.severity === 'Warning' ? 'bg-warning' : insight.severity === 'Positive' ? 'bg-success' : 'bg-brand-cyan'}`}></span>
                        {insight.severity} Severity
                        <span className="mx-1">•</span>
                        {insight.confidence}% Confidence
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white/90 bg-surface-black border border-white/10 px-2 py-1 rounded">
                      {insight.supportingMetric}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 text-xs mb-3">
                    <div className="text-white/60">
                      <span className="text-white/40 font-medium uppercase tracking-wide text-[10px]">Affected Pop: </span>
                      {insight.affectedPopulation}
                    </div>
                    <div className="text-brand-cyan/90 bg-brand-cyan/5 p-2 rounded border border-brand-cyan/10">
                      <span className="text-brand-cyan/50 font-medium uppercase tracking-wide text-[10px]">Action: </span>
                      {insight.recommendedAction}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-white/5 gap-2 text-[10px]">
                    <div className="flex items-center gap-1 text-white/40">
                      <Clock className="h-3 w-3" />
                      <span>{insight.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/50">
                      <LinkIcon className="h-3 w-3" />
                      <span className="font-medium">Module:</span> {insight.relatedDashboard}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

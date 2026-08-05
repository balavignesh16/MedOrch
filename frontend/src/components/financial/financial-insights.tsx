import React from 'react';
import { AlertCircle, CheckCircle, Info, Flame, Activity } from 'lucide-react';

interface InsightData {
  title: string;
  severity: 'Positive' | 'Warning' | 'Critical' | 'Info' | string;
  confidence: number;
  supportingMetric: string;
  businessImpact?: string;
  recommendedAction?: string;
  relatedDashboard?: string;
}

interface FinancialInsightsProps {
  insights: InsightData[];
}

export function FinancialInsights({ insights }: FinancialInsightsProps) {
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
    <div className="bg-surface-obsidian border border-border-glass rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-cyan" /> 
          Financial Insights
        </h3>
        <span className="text-[10px] uppercase tracking-wider font-bold text-brand-cyan bg-brand-cyan/10 px-2 py-1 rounded-full">
          Rule Engine
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {insights.map((insight, idx) => {
          const styles = getSeverityStyles(insight.severity);
          return (
            <div key={idx} className={`relative p-4 rounded-lg border ${styles.border} ${styles.bg} transition-all hover:bg-white/5`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{styles.icon}</div>
                <div className="flex-1">
                  <div className="flex flex-col items-start gap-2 mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white/90 leading-tight">{insight.title}</h4>
                      <span className="inline-flex items-center gap-1 text-[10px] text-white/50 mt-1 uppercase tracking-wider font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${insight.severity === 'Critical' ? 'bg-danger' : insight.severity === 'Warning' ? 'bg-warning' : insight.severity === 'Positive' ? 'bg-success' : 'bg-brand-cyan'}`}></span>
                        {insight.severity} Severity
                        <span className="mx-1">•</span>
                        {insight.confidence}% Confidence
                      </span>
                    </div>
                    <span className="text-xs font-bold text-brand-cyan bg-surface-black border border-white/10 px-2 py-1 rounded inline-block">
                      {insight.supportingMetric}
                    </span>
                  </div>
                  
                  {insight.businessImpact && (
                    <div className="text-xs text-white/70 mt-2 mb-2 leading-relaxed">
                      <strong className="text-white/90">Impact:</strong> {insight.businessImpact}
                    </div>
                  )}

                  {insight.recommendedAction && (
                    <div className="mt-3 p-2 bg-surface-black/30 rounded border border-white/5 text-xs text-brand-teal flex flex-col md:flex-row md:items-center justify-between">
                      <span><strong>Action:</strong> {insight.recommendedAction}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

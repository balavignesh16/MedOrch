import React from 'react';
import { Lightbulb, AlertTriangle, ShieldAlert, Info, ArrowRight } from 'lucide-react';
import { Insight } from '@/lib/analytics/types';
import { SEVERITY } from '@/lib/analytics/constants';

interface AdministrativeInsightsProps {
  insights: Insight[];
}

export const AdministrativeInsights: React.FC<AdministrativeInsightsProps> = ({ insights }) => {
  const getSeverityStyles = (severity: string | undefined) => {
    switch (severity) {
      case SEVERITY.CRITICAL:
        return { bg: 'bg-brand-error/10', border: 'border-brand-error/20', icon: <ShieldAlert className="w-5 h-5 text-brand-error" />, text: 'text-brand-error' };
      case SEVERITY.WARNING:
        return { bg: 'bg-brand-warning/10', border: 'border-brand-warning/20', icon: <AlertTriangle className="w-5 h-5 text-brand-warning" />, text: 'text-brand-warning' };
      case SEVERITY.POSITIVE:
        return { bg: 'bg-brand-success/10', border: 'border-brand-success/20', icon: <Lightbulb className="w-5 h-5 text-brand-success" />, text: 'text-brand-success' };
      default:
        return { bg: 'bg-brand-cyan/5', border: 'border-brand-cyan/20', icon: <Info className="w-5 h-5 text-brand-cyan" />, text: 'text-brand-cyan' };
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="text-base font-semibold text-white flex items-center">
          <Lightbulb className="text-brand-cyan w-5 h-5 mr-2" />
          Administrative Insights
        </h3>
        <div className="text-[10px] text-brand-gray px-3 py-1 bg-slate-900/50 rounded-full border border-white/5 hidden sm:block">
          AI-Generated via Shared Analytics Core
        </div>
      </div>
      <div className="space-y-4 overflow-y-auto flex-1 pr-2">
        {insights.map((insight, index) => {
          const styles = getSeverityStyles(insight.severity);
          return (
            <div key={index} className={`p-4 rounded-xl border ${styles.border} ${styles.bg} transition-all duration-300 hover:shadow-lg hover:border-white/20 group`}>
              <div className="flex gap-4">
                <div className="mt-1 shrink-0">
                  {styles.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                    <h4 className={`text-sm font-bold ${styles.text} leading-tight`}>{insight.title}</h4>
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-1 bg-slate-900/50 rounded-full text-white/70 border border-white/5 shrink-0">
                      {insight.confidence}% Conf
                    </span>
                  </div>
                  
                  <div className="flex flex-col space-y-3 mb-4">
                     <div>
                        <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Supporting Metric</span>
                        <span className="text-xs font-semibold text-white/90">{insight.supportingMetric}</span>
                     </div>
                     <div>
                        <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Operational Impact</span>
                        <span className="text-xs text-white/80">{insight.operationalImpact}</span>
                     </div>
                  </div>

                  <div className="flex flex-col pt-3 border-t border-white/10 space-y-3">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-brand-teal mb-1">Recommended Action:</span>
                      <span className="text-xs text-white/90 font-medium leading-relaxed">{insight.recommendedAction}</span>
                    </div>
                    <div className="flex justify-end">
                      <button className="flex items-center text-[10px] uppercase tracking-wider font-semibold text-brand-cyan hover:text-white transition-colors">
                        {insight.relatedDashboard || 'View Details'} <ArrowRight className="w-3 h-3 ml-1" />
                      </button>
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
};

import React from 'react';
import { PredictiveInsight } from '@/lib/analytics/insightEngine';
import { Lightbulb } from 'lucide-react';

interface PredictiveInsightsProps {
  insights: PredictiveInsight[];
}

export const PredictiveInsights: React.FC<PredictiveInsightsProps> = ({ insights }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal via-brand-cyan to-brand-blue"></div>
      <h3 className="text-base font-semibold text-white mb-6 flex items-center">
        <Lightbulb className="text-brand-cyan w-5 h-5 mr-2" />
        Predictive Insights
      </h3>
      <div className="space-y-4">
        {insights.map((insight, idx) => (
          <div key={idx} className={`p-4 rounded-xl border border-white/5 shadow-lg relative overflow-hidden group hover:bg-white/5 transition-colors ${
            insight.severity === 'CRITICAL' ? 'bg-brand-error/10' :
            insight.severity === 'WARNING' ? 'bg-brand-warning/10' :
            'bg-brand-cyan/10'
          }`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              insight.severity === 'CRITICAL' ? 'bg-brand-error' :
              insight.severity === 'WARNING' ? 'bg-brand-warning' :
              'bg-brand-cyan'
            }`}></div>
            <div className="flex justify-between items-start pl-2">
              <h4 className="text-sm font-medium text-white group-hover:text-brand-cyan transition-colors">{insight.title}</h4>
              <span className="text-[10px] text-brand-success bg-brand-success/10 border border-brand-success/20 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                {insight.confidence}% Conf
              </span>
            </div>
            <div className="mt-2 pl-2 text-xs text-brand-cyan font-mono">
              {insight.predictedMetric} (Risk: {insight.riskScore})
            </div>
            <div className="mt-3 pl-2 text-xs text-white/70">
              <strong className="text-white/90 font-medium">Drivers:</strong> {insight.supportingFeatures}
            </div>
            <div className="mt-3 pl-2 text-xs text-brand-gray flex items-start">
              <Lightbulb className="w-3.5 h-3.5 text-brand-warning mr-1.5 shrink-0" />
              <span className="text-white/80">{insight.recommendedAction}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

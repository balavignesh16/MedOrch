import React from 'react';
import { AlertCircle, CheckCircle, Info, Flame, Users, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import type { Insight } from '@/lib/analytics';

export function QualityInsights({ insights }: { insights: Insight[] }) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return <Flame className="h-5 w-5 text-danger shrink-0" />;
      case 'Warning':
        return <AlertCircle className="h-5 w-5 text-brand-orange shrink-0" />;
      case 'Positive':
        return <CheckCircle className="h-5 w-5 text-success shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-brand-cyan shrink-0" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'border-danger/30 bg-danger/5';
      case 'Warning': return 'border-brand-orange/30 bg-brand-orange/5';
      case 'Positive': return 'border-success/30 bg-success/5';
      default: return 'border-brand-cyan/30 bg-brand-cyan/5';
    }
  };

  return (
    <div className="space-y-4">
      {insights.map((insight, idx) => {
        const severity = insight.severity || insight.type || 'Info';
        const relatedDashboard = insight.relatedDashboard || 'Clinical Quality';
        return (
        <div 
          key={idx} 
          className={`p-4 rounded-xl border flex flex-col gap-3 ${getSeverityColor(severity)}`}
        >
          <div className="flex gap-3 items-start">
            {getSeverityIcon(severity)}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">{insight.title || 'Quality insight'}</h4>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-black/50 text-white/70 border border-white/10">
                  Rule-based
                </span>
              </div>
              <p className="text-sm text-brand-cyan mt-1 font-medium">{insight.supportingMetric || 'See quality metrics'}</p>
              
              <div className="mt-3 space-y-2">
                <div>
                  <span className="text-[10px] uppercase text-white/50 tracking-wider block">Clinical Impact</span>
                  <p className="text-xs text-white/80 leading-relaxed">{insight.clinicalImpact || 'Review the supporting cohort data.'}</p>
                </div>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Info className="h-3 w-3 text-white/40" />
                    <span className="text-xs text-white/90">{insight.recommendedAction || 'Review the related dashboard.'}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-white/40" />
                    <span className="text-xs text-white/90">{insight.affectedPatients?.toLocaleString() || 'N/A'} encounters</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <LinkIcon className="h-3 w-3 text-white/40" />
                    <Link href={`#${relatedDashboard.toLowerCase().replace(/\s+/g, '-')}`} className="text-xs text-brand-cyan hover:underline">
                      {relatedDashboard}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )})}
    </div>
  );
}

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lightbulb, AlertTriangle, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Insight } from '@/lib/analytics';

interface OperationalInsightsProps {
  insights: Insight[];
}

export function OperationalInsights({ insights }: OperationalInsightsProps) {
  if (!insights || insights.length === 0) return null;

  const getIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-danger" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'positive': return <CheckCircle2 className="h-4 w-4 text-success" />;
      default: return <Info className="h-4 w-4 text-brand-cyan" />;
    }
  };

  return (
    <Card className="bg-surface-black/40 border-white/5 h-full">
      <CardHeader className="border-b border-white/5">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-warning" />
          AI Operational Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {insights.map((insight, idx) => (
            <div key={idx} className="p-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {getIcon(insight.severity)}
                  <h4 className="font-bold text-white text-sm">{insight.title}</h4>
                </div>
                <span className="text-[10px] bg-white/10 text-brand-cyan px-2 py-0.5 rounded-full font-bold">
                  Synthetic scenario
                </span>
              </div>
              <p className="text-sm text-white/70 mb-3">
                <strong className="text-white/90">Impact:</strong> {insight.operationalImpact}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <span className="text-[10px] text-white/50 uppercase block mb-0.5">Root Cause</span>
                  <span className="text-xs text-white/90">{insight.rootCause}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/50 uppercase block mb-0.5">Affected</span>
                  <span className="text-xs text-white/90">{insight.affectedPopulation}</span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-surface-obsidian p-2 rounded-lg border border-white/5">
                <span className="text-xs text-brand-teal font-medium flex-1">
                  Action: {insight.recommendedAction}
                </span>
                <Link href="/population" className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1 shrink-0 ml-2">
                  {insight.relatedDashboard} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

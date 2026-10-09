import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertOctagon, AlertTriangle, ArrowRight, Activity, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface Bottleneck {
  title: string;
  severity: string;
  confidence: number;
  supportingMetric: string;
  rootCause: string;
  operationalImpact: string;
  estimatedDelay: string;
  recommendedAction: string;
  relatedDashboard: string;
  drilldown: string;
}

interface BottleneckIntelligenceProps {
  bottlenecks: Bottleneck[];
}

export function BottleneckIntelligence({ bottlenecks }: BottleneckIntelligenceProps) {
  if (!bottlenecks || bottlenecks.length === 0) return null;

  return (
    <Card className="bg-surface-black/40 border-white/5 h-full">
      <CardHeader className="border-b border-white/5">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-brand-orange" />
          Bottleneck Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {bottlenecks.map((item, idx) => (
            <div key={idx} className="p-6 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {item.severity === 'Critical' ? (
                    <div className="p-2 bg-danger/20 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-danger" />
                    </div>
                  ) : (
                    <div className="p-2 bg-warning/20 rounded-lg">
                      <Activity className="h-5 w-5 text-warning" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-white">{item.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-[10px] uppercase tracking-wider font-bold">
                      <span className={item.severity === 'Critical' ? 'text-danger' : 'text-warning'}>
                        {item.severity}
                      </span>
                      <span className="text-brand-cyan">Synthetic demo scenario</span>
                      <span className="text-white/50">{item.supportingMetric}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-white/50 block mb-1">Estimated Delay</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3 text-brand-orange" />
                    {item.estimatedDelay}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-surface-obsidian border border-white/5 p-3 rounded-lg">
                  <span className="text-[10px] text-white/50 uppercase block mb-1 font-bold">Root Cause</span>
                  <p className="text-sm text-white/80">{item.rootCause}</p>
                </div>
                <div className="bg-surface-obsidian border border-white/5 p-3 rounded-lg">
                  <span className="text-[10px] text-white/50 uppercase block mb-1 font-bold">Operational Impact</span>
                  <p className="text-sm text-white/80">{item.operationalImpact}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-teal" />
                  <span className="text-sm text-brand-teal font-medium">Action: {item.recommendedAction}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-white/50">Dashboard: {item.relatedDashboard}</span>
                  <Link 
                    href={item.drilldown}
                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                  >
                    Analyze Cohort <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

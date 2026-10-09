import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowRight, AlertTriangle, Users } from 'lucide-react';
import Link from 'next/link';

interface FlowStage {
  stage: string;
  count: number;
  avgTime: string;
  queue: number;
  dropoff: number;
  capacity: number;
  bottleneck: boolean;
}

interface PatientFlowDashboardProps {
  flowData: FlowStage[];
}

export function PatientFlowDashboard({ flowData }: PatientFlowDashboardProps) {
  if (!flowData || flowData.length === 0) return null;

  return (
    <Card className="bg-surface-black/40 border-white/5">
      <CardHeader className="border-b border-white/5">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-cyan" />
          Synthetic Patient Flow Scenario
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 overflow-x-auto">
        <p className="text-xs text-warning mb-4">Volumes, times, queues, drop-off rates, and capacity values are illustrative estimates.</p>
        <div className="flex items-start min-w-[1000px] gap-2">
          {flowData.map((stage, i) => (
            <React.Fragment key={stage.stage}>
              <div className="flex-1">
                <div className={`p-4 rounded-xl border relative ${stage.bottleneck ? 'bg-danger/10 border-danger/30' : 'bg-surface-obsidian border-white/10'}`}>
                  {stage.bottleneck && (
                    <div className="absolute -top-3 -right-2 bg-danger text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Bottleneck
                    </div>
                  )}
                  
                  <h4 className="font-bold text-white mb-3 text-center">{stage.stage}</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 text-xs">Volume</span>
                      <span className="text-white font-medium">{stage.count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 text-xs">Avg Time</span>
                      <span className="text-brand-cyan font-medium">{stage.avgTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 text-xs">Queue Size</span>
                      <span className={`font-medium ${stage.queue > 100 ? 'text-warning' : 'text-white'}`}>{stage.queue}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 text-xs">Drop-off</span>
                      <span className={`font-medium ${stage.dropoff > 10 ? 'text-danger' : 'text-success'}`}>{stage.dropoff}%</span>
                    </div>
                    
                    <div className="pt-2 mt-2 border-t border-white/10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white/50 text-[10px] uppercase tracking-wider">Capacity</span>
                        <span className="text-white text-[10px]">{stage.capacity}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${stage.capacity > 90 ? 'bg-danger' : stage.capacity > 75 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${stage.capacity}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 text-center">
                    <Link href={`/population?stage=${stage.stage.toLowerCase()}`} className="text-[10px] uppercase tracking-wider text-brand-cyan hover:text-white transition-colors">
                      Drill Down &rarr;
                    </Link>
                  </div>
                </div>
              </div>
              {i < flowData.length - 1 && (
                <div className="flex items-center justify-center shrink-0 w-8 pt-12">
                  <ArrowRight className="h-5 w-5 text-white/20" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

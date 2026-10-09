import React from 'react';
import type { fetchSystemHealth } from '@/lib/platformLogic';
import { Server, Database } from 'lucide-react';

interface SystemHealthProps {
  metrics: Awaited<ReturnType<typeof fetchSystemHealth>>;
}

export function SystemHealth({ metrics }: SystemHealthProps) {
  const getStatusColor = (status: string) => {
     switch (status) {
      case 'Operational': return 'text-brand-teal bg-brand-teal/10 border-brand-teal/20';
      case 'Degraded': return 'text-warning bg-warning/10 border-warning/20';
      case 'Outage': return 'text-danger bg-danger/10 border-danger/20';
      default: return 'text-white/50 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-brand-teal" /> System Health & Diagnostics
        </h3>
        <div className="flex items-center gap-2">
           <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-teal"></span>
            </span>
            <span className="text-xs text-white/60">All Systems Normal</span>
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {metrics.map((metric, idx) => (
              <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-xl">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                       <Database className="w-4 h-4 text-white/40" />
                       <span className="text-sm font-medium text-white">{metric.service}</span>
                    </div>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${getStatusColor(metric.status)}`}>
                       {metric.status}
                    </span>
                    <div className="text-right">
                       <p className="text-xs text-white/50">Latency: <span className="text-white">{metric.latency}</span></p>
                       <p className="text-xs text-white/50">Uptime: <span className="text-brand-teal">{metric.uptime}</span></p>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
}

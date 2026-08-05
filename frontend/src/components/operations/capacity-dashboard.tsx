import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LayoutTemplate, AlertTriangle, ShieldCheck, ActivitySquare } from 'lucide-react';

interface CapacityMetrics {
  current: number;
  available: number;
  estimated: number;
  capacityPercent: number;
  critical: string[];
  warning: string[];
  safe: string[];
  trend: string;
  variance: string;
}

interface CapacityDashboardProps {
  metrics: CapacityMetrics;
}

export function CapacityDashboard({ metrics }: CapacityDashboardProps) {
  if (!metrics) return null;

  return (
    <Card className="bg-surface-black/40 border-white/5 h-full">
      <CardHeader className="border-b border-white/5">
        <CardTitle className="text-lg flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-brand-cyan" />
          Hospital Capacity Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface-obsidian border border-white/10 p-4 rounded-xl">
            <span className="text-[10px] uppercase text-white/50 block mb-1">Current Load</span>
            <span className="text-2xl font-bold text-white">{metrics.current}</span>
            <span className="text-[10px] text-white/40 ml-2">Beds</span>
          </div>
          <div className="bg-surface-obsidian border border-white/10 p-4 rounded-xl">
            <span className="text-[10px] uppercase text-white/50 block mb-1">Available</span>
            <span className={`text-2xl font-bold ${metrics.available < 50 ? 'text-danger' : 'text-success'}`}>{metrics.available}</span>
            <span className="text-[10px] text-white/40 ml-2">Beds</span>
          </div>
          <div className="bg-surface-obsidian border border-white/10 p-4 rounded-xl">
            <span className="text-[10px] uppercase text-white/50 block mb-1">Est 24h Demand</span>
            <span className="text-2xl font-bold text-brand-cyan">{metrics.estimated}</span>
            <span className="text-[10px] text-white/40 ml-2">Beds</span>
          </div>
          <div className="bg-brand-cyan/10 border border-brand-cyan/30 p-4 rounded-xl">
            <span className="text-[10px] uppercase text-brand-cyan block mb-1">Utilization</span>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-white">{metrics.capacityPercent}%</span>
              <span className={`text-xs mb-1 font-medium ${metrics.trend.startsWith('+') ? 'text-danger' : 'text-success'}`}>
                {metrics.trend}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] uppercase tracking-wider text-white/50 mb-2 border-b border-white/10 pb-2">
            Departmental Status
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-danger/10 border border-danger/20 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-danger" />
                <span className="text-xs font-bold text-white uppercase">Critical &gt; 95%</span>
              </div>
              <ul className="space-y-2">
                {metrics.critical.map((dept, i) => (
                  <li key={i} className="text-sm text-white/90 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-danger"></div>
                    {dept}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <ActivitySquare className="h-4 w-4 text-warning" />
                <span className="text-xs font-bold text-white uppercase">Warning 85-95%</span>
              </div>
              <ul className="space-y-2">
                {metrics.warning.map((dept, i) => (
                  <li key={i} className="text-sm text-white/90 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-warning"></div>
                    {dept}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-success/10 border border-success/20 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-4 w-4 text-success" />
                <span className="text-xs font-bold text-white uppercase">Safe &lt; 85%</span>
              </div>
              <ul className="space-y-2">
                {metrics.safe.map((dept, i) => (
                  <li key={i} className="text-sm text-white/90 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                    {dept}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

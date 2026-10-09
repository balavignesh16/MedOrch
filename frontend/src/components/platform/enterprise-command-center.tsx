import React from 'react';
import { Activity, ShieldCheck, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';

export function EnterpriseCommandCenter() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Platform Health */}
      <div className="group relative bg-gradient-to-br from-surface-black to-surface-obsidian border border-white/10 hover:border-brand-teal/40 p-6 rounded-3xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(45,212,191,0.15)] hover:-translate-y-1 overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-24 h-24 text-brand-teal" />
         </div>
         <div className="relative z-10">
           <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-teal flex items-center gap-2">
                 Platform Health
              </span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-teal"></span>
              </span>
           </div>
           <div className="text-4xl font-black text-white tracking-tight mb-1">99.99<span className="text-xl text-white/40 font-bold">%</span></div>
           <p className="text-sm text-white/50 font-medium flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
             All services operational
           </p>
         </div>
      </div>

      {/* Enterprise Readiness */}
      <div className="group relative bg-gradient-to-br from-surface-black to-surface-obsidian border border-white/10 hover:border-brand-cyan/40 p-6 rounded-3xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] hover:-translate-y-1 overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="w-24 h-24 text-brand-cyan" />
         </div>
         <div className="relative z-10">
           <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                 Enterprise Readiness
              </span>
           </div>
           <div className="text-4xl font-black text-white tracking-tight mb-1">84<span className="text-xl text-white/40 font-bold">/100</span></div>
           <p className="text-sm text-brand-cyan font-medium flex items-center gap-1.5">
             <TrendingUp className="w-3.5 h-3.5" />
             +2 pts this week
           </p>
         </div>
      </div>

      {/* Active Critical Alerts */}
      <div className="group relative bg-gradient-to-br from-danger/10 via-surface-black to-surface-obsidian border border-danger/20 hover:border-danger/50 p-6 rounded-3xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(239,68,68,0.2)] hover:-translate-y-1 overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="w-24 h-24 text-danger" />
         </div>
         <div className="relative z-10">
           <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-danger flex items-center gap-2">
                 Critical Alerts
              </span>
              <span className="px-2 py-0.5 rounded-full bg-danger/20 text-danger text-[10px] font-bold">ACTION REQ</span>
           </div>
           <div className="text-4xl font-black text-white tracking-tight mb-1">3</div>
           <p className="text-sm text-danger/80 font-medium">Requires immediate action</p>
         </div>
      </div>

      {/* Financial Status */}
      <div className="group relative bg-gradient-to-br from-surface-black to-surface-obsidian border border-white/10 hover:border-brand-orange/40 p-6 rounded-3xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(249,115,22,0.15)] hover:-translate-y-1 overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-24 h-24 text-brand-orange" />
         </div>
         <div className="relative z-10">
           <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                 Financial Status
              </span>
           </div>
           <div className="text-4xl font-black text-white tracking-tight mb-1">Stable</div>
           <p className="text-sm text-brand-orange font-medium flex items-center gap-1.5">
             <TrendingUp className="w-3.5 h-3.5" />
             Operating margin at 4.2%
           </p>
         </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Activity, ShieldCheck, TrendingUp, DollarSign, Users, AlertTriangle } from 'lucide-react';

export function EnterpriseCommandCenter() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Platform Health */}
      <div className="bg-gradient-to-br from-brand-teal/20 to-brand-cyan/5 border border-brand-teal/20 p-4 rounded-2xl">
         <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-brand-teal font-medium flex items-center gap-2">
               <Activity className="w-4 h-4" /> Platform Health
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-teal"></span>
            </span>
         </div>
         <div className="text-2xl font-bold text-white">99.99%</div>
         <p className="text-xs text-white/50 mt-1">All services operational</p>
      </div>

      {/* Enterprise Readiness */}
      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
         <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/70 font-medium flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-brand-cyan" /> Enterprise Readiness
            </span>
         </div>
         <div className="text-2xl font-bold text-white">84<span className="text-lg text-white/50">/100</span></div>
         <p className="text-xs text-brand-teal mt-1">+2 pts this week</p>
      </div>

      {/* Active Critical Alerts */}
      <div className="bg-danger/10 border border-danger/20 p-4 rounded-2xl">
         <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-danger font-medium flex items-center gap-2">
               <AlertTriangle className="w-4 h-4" /> Critical Alerts
            </span>
         </div>
         <div className="text-2xl font-bold text-white">3</div>
         <p className="text-xs text-danger/70 mt-1">Requires immediate action</p>
      </div>

      {/* Financial Status */}
      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
         <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/70 font-medium flex items-center gap-2">
               <DollarSign className="w-4 h-4 text-brand-orange" /> Financial Status
            </span>
         </div>
         <div className="text-2xl font-bold text-white">Stable</div>
         <p className="text-xs text-brand-teal mt-1">Operating margin at 4.2%</p>
      </div>
    </div>
  );
}

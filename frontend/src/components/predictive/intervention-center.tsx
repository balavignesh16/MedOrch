import React from 'react';
import { ListChecks, TrendingDown, Users, Clock } from 'lucide-react';

interface InterventionCenterProps {
  interventions: any[];
}

export const InterventionCenter: React.FC<InterventionCenterProps> = ({ interventions }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-warning via-brand-teal to-brand-blue opacity-80"></div>
      <h3 className="text-base font-semibold text-white mb-6 flex items-center">
        <ListChecks className="text-brand-teal w-5 h-5 mr-2" />
        Prioritized Intervention Queue
      </h3>
      <div className="space-y-4">
        {interventions.map((inv) => (
          <div key={inv.id} className="p-4 bg-slate-900/50 hover:bg-slate-900/80 transition-colors border border-white/5 rounded-xl flex flex-col group relative overflow-hidden">
            {/* Priority Indicator Line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              inv.priority === 'Critical' ? 'bg-brand-error shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
              inv.priority === 'High' ? 'bg-brand-warning shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
              'bg-brand-cyan shadow-[0_0_8px_rgba(34,211,238,0.6)]'
            }`}></div>
            <div className="flex justify-between items-start pl-2">
              <h4 className="text-sm font-medium text-white group-hover:text-brand-cyan transition-colors">{inv.action}</h4>
              <span className={`text-[10px] px-2 py-1 rounded font-semibold uppercase tracking-wider ${
                inv.priority === 'Critical' ? 'bg-brand-error/10 text-brand-error border border-brand-error/20' :
                inv.priority === 'High' ? 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20' :
                'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20'
              }`}>
                {inv.priority}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/70 pl-2">
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md flex items-center">
                <TrendingDown className="w-3.5 h-3.5 text-brand-cyan mr-1.5" />
                {inv.impact}
              </span>
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md flex items-center">
                <Users className="w-3.5 h-3.5 text-brand-teal mr-1.5" />
                {inv.team}
              </span>
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md flex items-center">
                <Clock className="w-3.5 h-3.5 text-brand-warning mr-1.5" />
                {inv.timeline}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

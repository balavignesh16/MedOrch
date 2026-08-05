import React from 'react';
import { BedDouble, AlertCircle } from 'lucide-react';

interface CapacityAllocationProps {
  capacity: any;
}

export const CapacityAllocation: React.FC<CapacityAllocationProps> = ({ capacity }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-purple via-brand-cyan to-brand-blue opacity-80"></div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-white flex items-center">
          <BedDouble className="text-brand-cyan w-5 h-5 mr-2" />
          Capacity Allocation
        </h3>
        <div className="text-xs text-brand-gray px-3 py-1 bg-slate-900/50 rounded-full border border-white/5">
          Administrative Analytics Model (Analytical)
        </div>
      </div>

      <div className="flex items-center gap-6 mb-8 bg-slate-900/50 p-4 rounded-xl border border-white/5">
        <div className="flex-1">
          <div className="flex justify-between items-center text-[10px] mb-2">
            <span className="text-brand-gray uppercase tracking-widest font-semibold mr-2 truncate">Total Hospital Capacity</span>
            <span className="text-white font-mono whitespace-nowrap">{capacity.allocatedBeds} / {capacity.totalBeds} Beds</span>
          </div>
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${
              capacity.utilizationPercent > 95 ? 'bg-brand-error shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
              capacity.utilizationPercent > 85 ? 'bg-brand-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
              'bg-brand-cyan shadow-[0_0_8px_rgba(34,211,238,0.5)]'
            }`} style={{ width: `${capacity.utilizationPercent}%` }}></div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-white">{capacity.utilizationPercent}%</div>
          <div className="text-[10px] text-brand-gray uppercase tracking-widest mt-1">Utilization</div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Department Allocation</h4>
        {capacity.departments.map((dept: any, i: number) => (
          <div key={i} className="flex flex-col text-xs">
            <div className="flex justify-between mb-1">
              <span className="text-white/80 font-medium">{dept.name}</span>
              <span className="text-white font-mono">
                {dept.used} <span className="text-brand-gray">/ {dept.allocated}</span>
                {dept.percent > 100 && <AlertCircle className="w-3 h-3 text-brand-error inline-block ml-2 mb-0.5" />}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-900 overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  dept.percent > 100 ? 'bg-brand-error shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                  dept.percent > 90 ? 'bg-brand-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                  'bg-brand-cyan shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                }`}
                style={{ width: `${Math.min(dept.percent, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

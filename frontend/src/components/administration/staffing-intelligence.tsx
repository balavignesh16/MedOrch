import React from 'react';
import { Users, Activity, Battery, TriangleAlert } from 'lucide-react';

interface StaffingIntelligenceProps {
  staffing: any;
}

export const StaffingIntelligence: React.FC<StaffingIntelligenceProps> = ({ staffing }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-warning via-brand-orange to-brand-error opacity-80"></div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-white flex items-center">
          <Users className="text-brand-orange w-5 h-5 mr-2" />
          Staffing Intelligence
        </h3>
        <div className="text-xs text-brand-gray px-3 py-1 bg-slate-900/50 rounded-full border border-white/5">
          Administrative Analytics Model (Analytical)
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <div className="text-xs text-brand-gray mb-1 uppercase tracking-wider flex items-center">
            <Activity className="w-3 h-3 mr-1 text-brand-cyan shrink-0" /> Estimated Load
          </div>
          <div className="text-2xl font-bold text-white">{staffing.estimatedLoad}%</div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <div className="text-xs text-brand-gray mb-1 uppercase tracking-wider flex items-center">
            <Users className="w-3 h-3 mr-1 text-brand-teal" /> Staff-to-Patient Ratio
          </div>
          <div className="text-2xl font-bold text-white">{staffing.staffToPatientRatio}</div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <div className="text-xs text-brand-gray mb-1 uppercase tracking-wider flex items-center">
            <Battery className="w-3 h-3 mr-1 text-brand-warning" /> Shift Balance
          </div>
          <div className="text-2xl font-bold text-white">{staffing.shiftBalance}%</div>
        </div>
        <div className="bg-brand-error/10 p-4 rounded-xl border border-brand-error/20">
          <div className="text-[10px] text-brand-error mb-1 uppercase tracking-wider flex items-center truncate">
            <TriangleAlert className="w-3 h-3 mr-1 shrink-0" /> Resource Gap
          </div>
          <div className="text-xl font-bold text-brand-error truncate">{staffing.resourceGap}</div>
        </div>
        <div className="bg-brand-warning/10 p-4 rounded-xl border border-brand-warning/20">
          <div className="text-[10px] text-brand-warning mb-1 uppercase tracking-wider flex items-center truncate">
            <TriangleAlert className="w-3 h-3 mr-1 shrink-0" /> Coverage Risk
          </div>
          <div className="text-xl font-bold text-brand-warning truncate">{staffing.coverageRisk}</div>
        </div>
        <div className="bg-brand-cyan/10 p-4 rounded-xl border border-brand-cyan/20">
          <div className="text-xs text-brand-cyan mb-1 uppercase tracking-wider flex items-center">
            <Activity className="w-3 h-3 mr-1" /> Capacity Impact
          </div>
          <div className="text-2xl font-bold text-brand-cyan">{staffing.capacityImpact}</div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Department Load Variances</h4>
        <div className="space-y-2">
          {staffing.departments.map((dept: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
              <div className="text-sm font-medium text-white/90 w-24">{dept.name}</div>
              <div className="text-xs text-brand-gray font-mono">Ratio: {dept.ratio}</div>
              <div className={`text-xs font-mono ${
                dept.status === 'Critical' ? 'text-brand-error' :
                dept.status === 'Warning' ? 'text-brand-warning' :
                'text-brand-success'
              }`}>
                Var: {dept.variance}
              </div>
              <div className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                dept.status === 'Critical' ? 'bg-brand-error/10 text-brand-error border border-brand-error/20' :
                dept.status === 'Warning' ? 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20' :
                'bg-brand-success/10 text-brand-success border border-brand-success/20'
              }`}>
                {dept.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

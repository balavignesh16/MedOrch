import React from 'react';
import type { fetchAdministrativeOverview } from '@/lib/administrationLogic';
import { ShieldCheck, Info } from 'lucide-react';

interface AdministrativeScoreTransparencyProps {
  overview: Awaited<ReturnType<typeof fetchAdministrativeOverview>>;
}

export const AdministrativeScoreTransparency: React.FC<AdministrativeScoreTransparencyProps> = ({ overview }) => {
  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-full cursor-help hover:bg-slate-900/80 transition-colors">
        <ShieldCheck className="w-4 h-4 text-brand-cyan" />
        <span className="text-sm font-bold text-white">Score: {overview.score}/100 (Grade {overview.grade})</span>
        <Info className="w-3 h-3 text-brand-gray" />
      </div>

      <div className="absolute right-0 top-full mt-2 w-80 p-4 rounded-xl bg-slate-900/95 border border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 backdrop-blur-xl">
        <h4 className="text-sm font-semibold text-white mb-4 border-b border-white/10 pb-2">
          Administrative Score Breakdown
        </h4>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-brand-gray">Department Performance</span>
            <span className={overview.breakdown.department > 0 ? 'text-brand-error' : 'text-brand-success'}>
              {overview.breakdown.department > 0 ? `-${overview.breakdown.department}` : '0'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-brand-gray">Staffing Efficiency</span>
            <span className={overview.breakdown.staffing > 0 ? 'text-brand-error' : 'text-brand-success'}>
              {overview.breakdown.staffing > 0 ? `-${overview.breakdown.staffing}` : '0'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-brand-gray">Capacity Utilization</span>
            <span className={overview.breakdown.capacity > 0 ? 'text-brand-error' : 'text-brand-success'}>
              {overview.breakdown.capacity > 0 ? `-${overview.breakdown.capacity}` : '0'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-brand-gray">Compliance Health</span>
            <span className={overview.breakdown.compliance > 0 ? 'text-brand-error' : 'text-brand-success'}>
              {overview.breakdown.compliance > 0 ? `-${overview.breakdown.compliance}` : '0'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-brand-gray">Workflow Efficiency</span>
            <span className={overview.breakdown.workflow > 0 ? 'text-brand-error' : 'text-brand-success'}>
              {overview.breakdown.workflow > 0 ? `-${overview.breakdown.workflow}` : '0'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs border-b border-white/10 pb-3">
            <span className="text-brand-gray">Governance</span>
            <span className={overview.breakdown.governance > 0 ? 'text-brand-error' : 'text-brand-success'}>
              {overview.breakdown.governance > 0 ? `-${overview.breakdown.governance}` : '0'}
            </span>
          </div>
          
          <div className="flex justify-between items-center pt-1">
            <span className="text-sm font-bold text-white">Total Score</span>
            <div className="text-right">
              <span className="text-lg font-black text-brand-cyan">{overview.score}</span>
              <span className="text-xs text-brand-gray ml-1">/ 100</span>
            </div>
          </div>
          <div className="text-right text-[10px] text-brand-teal font-mono uppercase tracking-widest">
            Grade {overview.grade}
          </div>
        </div>
      </div>
    </div>
  );
};

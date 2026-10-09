import React from 'react';
import type { fetchDepartmentScorecards } from '@/lib/administrationLogic';
import Link from 'next/link';
import { LayoutDashboard, ArrowUpRight, ArrowDownRight, Minus, ArrowRight } from 'lucide-react';

interface DepartmentScorecardsProps {
  scorecards: Awaited<ReturnType<typeof fetchDepartmentScorecards>>;
}

export const DepartmentScorecards: React.FC<DepartmentScorecardsProps> = ({ scorecards }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-teal opacity-80"></div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-white flex items-center">
          <LayoutDashboard className="text-brand-cyan w-5 h-5 mr-2" />
          Executive Department Scorecards
        </h3>
        <div className="text-xs text-brand-gray px-3 py-1 bg-slate-900/50 rounded-full border border-white/5">
          Administrative Analytics Model (Analytical)
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Department</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Overall Score</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Capacity / Util</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Efficiency</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Compliance</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Risk</th>
              <th className="py-3 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {scorecards.map((dept, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors group">
                <td className="py-4 px-4">
                  <div className="font-semibold text-white group-hover:text-brand-cyan transition-colors">{dept.name}</div>
                  <div className="text-[10px] text-brand-gray flex items-center mt-0.5">
                    Status: 
                    <span className={`ml-1 ${
                      dept.status === 'Excellent' ? 'text-brand-success' :
                      dept.status === 'Good' ? 'text-brand-cyan' :
                      dept.status === 'Warning' ? 'text-brand-warning' :
                      'text-brand-error'
                    }`}>{dept.status}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <span className={`text-lg font-bold ${
                      dept.score >= 90 ? 'text-brand-success' :
                      dept.score >= 85 ? 'text-brand-cyan' :
                      dept.score >= 80 ? 'text-brand-warning' :
                      'text-brand-error'
                    }`}>{dept.score}</span>
                    <span className="ml-2 text-brand-gray">
                      {dept.trend === 'up' ? <ArrowUpRight className="w-3 h-3 text-brand-success" /> :
                       dept.trend === 'down' ? <ArrowDownRight className="w-3 h-3 text-brand-error" /> :
                       <Minus className="w-3 h-3 text-brand-gray" />}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-xs text-white/90">
                    {dept.capacity}% <span className="text-white/30\">/</span> {dept.utilization}%
                  </div>
                  <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-brand-cyan rounded-full" style={{ width: `${dept.utilization}%` }}></div>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm font-mono text-white/80">{dept.efficiency}%</td>
                <td className="py-4 px-4 text-sm font-mono text-white/80">{dept.compliance}%</td>
                <td className="py-4 px-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                    dept.risk === 'Critical' ? 'bg-brand-error/10 text-brand-error border border-brand-error/20' :
                    dept.risk === 'High' ? 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20' :
                    dept.risk === 'Medium' ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20' :
                    'bg-brand-success/10 text-brand-success border border-brand-success/20'
                  }`}>
                    {dept.risk}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <Link href={`#drilldown-${dept.id}`} className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-brand-cyan hover:text-brand-teal bg-brand-cyan/5 hover:bg-brand-cyan/10 px-3 py-1.5 rounded-full transition-all">
                    Drill Down <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

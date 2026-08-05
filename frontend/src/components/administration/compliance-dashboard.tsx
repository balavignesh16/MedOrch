import React from 'react';
import { ShieldAlert, FileText, CheckCircle2, TrendingUp, AlertOctagon } from 'lucide-react';

interface ComplianceDashboardProps {
  compliance: any;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ compliance }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-success via-brand-cyan to-brand-teal opacity-80"></div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-white flex items-center">
          <ShieldAlert className="text-brand-success w-5 h-5 mr-2" />
          Compliance & Audit
        </h3>
        <div className="text-xs text-brand-gray px-3 py-1 bg-slate-900/50 rounded-full border border-white/5">
          Administrative Analytics Model (Analytical)
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-brand-success/20">
          <div className="text-[10px] text-brand-gray uppercase tracking-widest mb-1">Overall Compliance</div>
          <div className="text-3xl font-black text-brand-success">{compliance.compliancePercent}%</div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <div className="text-[10px] text-brand-gray uppercase tracking-widest mb-1">Doc Quality</div>
          <div className="text-2xl font-bold text-white">{compliance.documentationQuality}%</div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
          <div className="text-[10px] text-brand-gray uppercase tracking-widest mb-1 flex items-center">
             <CheckCircle2 className="w-3 h-3 mr-1 text-brand-teal" /> Data Completeness
          </div>
          <div className="text-2xl font-bold text-white">{compliance.dataCompleteness}%</div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-brand-warning/20">
          <div className="text-[10px] text-brand-warning uppercase tracking-widest mb-1">Missing Docs</div>
          <div className="text-2xl font-bold text-brand-warning">{compliance.missingDocumentation}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Department Compliance Ranking</h4>
          <div className="space-y-3">
            {compliance.departmentRanking.map((dept: any, index: number) => (
              <div key={index} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-brand-gray w-4">{dept.rank}.</span>
                  <span className="text-sm text-white/90 group-hover:text-brand-cyan transition-colors">{dept.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-cyan rounded-full" style={{ width: `${dept.score}%` }}></div>
                  </div>
                  <span className="text-xs font-mono text-white/80 w-8 text-right">{dept.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-brand-teal/5 border border-brand-teal/20 rounded-xl">
            <div className="flex items-center mb-2">
              <CheckCircle2 className="w-4 h-4 text-brand-teal mr-2" />
              <span className="text-sm font-semibold text-white">Audit Readiness</span>
            </div>
            <div className="text-2xl font-bold text-brand-teal mb-1">{compliance.auditReadiness}</div>
            <div className="text-xs text-brand-gray">All mandatory pre-audit checks are passing.</div>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center mb-2">
              <AlertOctagon className="w-4 h-4 text-brand-warning mr-2" />
              <span className="text-sm font-semibold text-white">Operational Risk</span>
            </div>
            <div className="text-lg font-bold text-white mb-1">{compliance.operationalRisk}</div>
            <div className="text-xs text-brand-gray">No immediate regulatory or compliance threats identified.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

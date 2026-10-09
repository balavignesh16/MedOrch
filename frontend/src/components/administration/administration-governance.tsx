import React from 'react';
import type { fetchAdministrativeGovernance } from '@/lib/administrationLogic';
import { ShieldCheck, FileCheck, CheckCircle2, AlertTriangle, Layers, Clock } from 'lucide-react';

interface AdministrationGovernanceProps {
  governance: Awaited<ReturnType<typeof fetchAdministrativeGovernance>>;
}

export const AdministrationGovernance: React.FC<AdministrationGovernanceProps> = ({ governance }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal via-brand-cyan to-brand-blue opacity-80"></div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-white flex items-center">
          <ShieldCheck className="text-brand-cyan w-5 h-5 mr-2" />
          Administrative Governance
        </h3>
        <div className="text-xs text-brand-gray px-3 py-1 bg-slate-900/50 rounded-full border border-white/5">
          Administrative Analytics Model (Analytical)
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 relative overflow-hidden flex items-center">
          <div className="w-12 h-12 rounded-full bg-brand-teal/10 flex items-center justify-center mr-4">
            <ShieldCheck className="w-6 h-6 text-brand-teal" />
          </div>
          <div>
            <div className="text-xs text-brand-gray uppercase tracking-wider mb-1">Governance Score</div>
            <div className="text-2xl font-bold text-white">{governance.governanceScore}<span className="text-sm text-brand-gray font-normal">/100</span></div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/50 flex items-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mr-4">
            <FileCheck className="w-6 h-6 text-brand-cyan" />
          </div>
          <div>
            <div className="text-xs text-brand-gray uppercase tracking-wider mb-1">Policy Compliance</div>
            <div className="text-xl font-bold text-white">{governance.policyCompliance}%</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/50 flex items-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mr-4">
            <CheckCircle2 className="w-6 h-6 text-brand-success" />
          </div>
          <div>
            <div className="text-xs text-brand-gray uppercase tracking-wider mb-1">Dept Audit Status</div>
            <div className="text-xl font-bold text-brand-success">{governance.departmentAuditStatus}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/50 flex items-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mr-4">
            <Layers className="w-6 h-6 text-brand-purple" />
          </div>
          <div>
            <div className="text-xs text-brand-gray uppercase tracking-wider mb-1">Data Quality</div>
            <div className="text-xl font-bold text-brand-purple">{governance.dataQuality}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/50 flex items-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mr-4">
            <AlertTriangle className="w-6 h-6 text-brand-warning" />
          </div>
          <div>
            <div className="text-xs text-brand-gray uppercase tracking-wider mb-1">Operational Readiness</div>
            <div className="text-xl font-bold text-brand-warning">{governance.operationalReadiness}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/50 flex items-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mr-4">
            <Clock className="w-6 h-6 text-brand-orange" />
          </div>
          <div>
            <div className="text-xs text-brand-gray uppercase tracking-wider mb-1">Pending Actions</div>
            <div className="text-xl font-bold text-brand-orange">{governance.pendingActions}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

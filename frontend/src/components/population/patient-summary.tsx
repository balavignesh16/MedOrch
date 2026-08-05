import React from 'react';
import { ShieldCheck, TrendingUp, AlertTriangle, Pill } from 'lucide-react';

interface PatientSummaryProps {
  profile: any;
  encounters: any[];
}

export function PatientSummary({ profile, encounters }: PatientSummaryProps) {
  const highestRiskDiag = encounters.length > 0 ? encounters[0].diag_1 : 'None';
  const readmissionHistory = encounters.some(e => e.readmitted !== 'NO') ? 'Frequent Readmissions' : 'No Recent Readmissions';
  
  let recommendation = 'Standard outpatient follow-up';
  if (profile.riskLevel === 'Critical') recommendation = 'Immediate multidisciplinary intervention required';
  else if (profile.riskLevel === 'High') recommendation = 'Assign to high-touch care management program';
  else if (profile.riskLevel === 'Medium') recommendation = 'Schedule 14-day post-discharge clinic visit';

  return (
    <div className="bg-surface-obsidian border border-border-glass rounded-xl p-6 mb-6">
      <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Rule-Based Clinical Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-black border border-white/5 rounded-lg p-4">
          <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Readmission History
          </span>
          <span className={`text-sm font-semibold ${
            readmissionHistory === 'Frequent Readmissions' ? 'text-brand-orange' : 'text-success'
          }`}>{readmissionHistory}</span>
        </div>
        <div className="bg-surface-black border border-white/5 rounded-lg p-4">
          <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Highest Risk Diagnosis
          </span>
          <span className="text-sm font-semibold text-white/90 font-mono">{highestRiskDiag}</span>
        </div>
        <div className="bg-surface-black border border-white/5 rounded-lg p-4">
          <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 flex items-center gap-1">
            <Pill className="h-3 w-3" /> Medication Burden
          </span>
          <span className={`text-sm font-semibold ${
            profile.totalMeds > 50 ? 'text-danger' : profile.totalMeds > 20 ? 'text-brand-orange' : 'text-success'
          }`}>{profile.totalMeds > 50 ? 'Severe Polypharmacy' : profile.totalMeds > 20 ? 'Moderate' : 'Low'}</span>
        </div>
        <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg p-4">
          <span className="block text-[10px] uppercase tracking-wider text-brand-cyan/60 mb-1 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Clinical Recommendation
          </span>
          <span className="text-sm font-semibold text-brand-cyan">
            {recommendation}
          </span>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface HighRiskPatientsProps {
  patients: any[];
}

export const HighRiskPatients: React.FC<HighRiskPatientsProps> = ({ patients }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-error via-brand-warning to-brand-cyan opacity-80"></div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-white flex items-center">
          <AlertTriangle className="text-brand-error w-5 h-5 mr-2" />
          High-Risk Cohort Predictions
        </h3>
        <div className="text-xs text-brand-gray px-3 py-1 bg-slate-900/50 rounded-full border border-white/5">
          Sorted by Risk Score
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-900/30">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-slate-900/50">
              <th className="py-3 px-4 text-[10px] font-semibold text-brand-gray uppercase tracking-widest">Patient ID</th>
              <th className="py-3 px-4 text-[10px] font-semibold text-brand-gray uppercase tracking-widest">Risk Score</th>
              <th className="py-3 px-4 text-[10px] font-semibold text-brand-gray uppercase tracking-widest">Readmission Prob</th>
              <th className="py-3 px-4 text-[10px] font-semibold text-brand-gray uppercase tracking-widest">Predicted LOS</th>
              <th className="py-3 px-4 text-[10px] font-semibold text-brand-gray uppercase tracking-widest">Top Risk Driver</th>
              <th className="py-3 px-4 text-[10px] font-semibold text-brand-gray uppercase tracking-widest">Confidence</th>
              <th className="py-3 px-4 text-[10px] font-semibold text-brand-gray uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm text-white">
            {patients.map((p, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                <td className="py-3 px-4 font-mono text-xs text-brand-cyan group-hover:text-brand-teal transition-colors">{p.patientId}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold shadow-sm ${
                    p.overallRisk > 80 ? 'bg-brand-error/10 text-brand-error border border-brand-error/30' : 'bg-brand-warning/10 text-brand-warning border border-brand-warning/30'
                  }`}>
                    {p.overallRisk.toFixed(0)}
                  </span>
                </td>
                <td className="py-3 px-4 text-white/90">{p.readmissionRisk.toFixed(1)}%</td>
                <td className="py-3 px-4 text-white/90">{p.predictedLos.toFixed(1)} d</td>
                <td className="py-3 px-4 text-xs text-white/70">{p.explainability.topDrivers[0]?.feature || 'N/A'}</td>
                <td className="py-3 px-4">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-success bg-brand-success/10 border border-brand-success/20 px-2 py-1 rounded">
                    {p.audit.confidence}% {p.explainability.confidenceCategory}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link href={`/population?patient=${p.patientId}`} className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-brand-cyan hover:text-brand-teal bg-brand-cyan/5 hover:bg-brand-cyan/10 px-3 py-1.5 rounded-full transition-all">
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

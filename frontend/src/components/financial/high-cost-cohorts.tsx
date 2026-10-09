'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, AlertCircle, ArrowRight } from 'lucide-react';

interface HighCostCohortsProps {
  data: {
    diag_1: string;
    count: number;
    total_cost: number;
    avg_cost: number;
    avg_los: number;
    readmission_rate: number;
    avg_meds: number;
  }[];
  totalPatients: number;
}

export function HighCostCohorts({ data, totalPatients }: HighCostCohortsProps) {
  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="bg-surface-obsidian border border-border-glass rounded-xl overflow-hidden flex flex-col w-full shadow-lg mb-6">
      <div className="p-4 border-b border-border-glass flex items-center justify-between bg-surface-black/30">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-brand-cyan" />
          <h2 className="text-lg font-bold text-white tracking-wide">
            High Cost Cohort Analysis
          </h2>
        </div>
        <div className="text-xs text-white/50">
          Top 15 Cohorts by Estimated Cost
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-black/50 text-white/60 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium border-b border-border-glass">Diagnosis Cohort</th>
              <th className="p-4 font-medium border-b border-border-glass">Patients</th>
              <th className="p-4 font-medium border-b border-border-glass">Est. Total Cost</th>
              <th className="p-4 font-medium border-b border-border-glass">Est. Avg Cost</th>
              <th className="p-4 font-medium border-b border-border-glass">Avg LOS</th>
              <th className="p-4 font-medium border-b border-border-glass">Readmission</th>
              <th className="p-4 font-medium border-b border-border-glass">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-white/50">
                  No cohorts found matching the selected criteria.
                </td>
              </tr>
            ) : (
              data.map((cohort, idx) => (
                <tr 
                  key={cohort.diag_1 || idx} 
                  className="border-b border-border-glass/50 hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="p-4">
                    <span className="text-white font-medium">
                      {cohort.diag_1?.replace(/^[0-9.]+\s+-\s+/, '') || 'Unknown Diagnosis'}
                    </span>
                    <div className="text-xs text-white/40 mt-1">
                      {cohort.diag_1?.split(' ')[0]}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-white">
                      {cohort.count.toLocaleString()}
                    </div>
                    <div className="text-xs text-white/40">
                      {((cohort.count / totalPatients) * 100).toFixed(1)}% of pop
                    </div>
                  </td>
                  <td className="p-4 text-brand-cyan font-semibold">
                    {formatCurrency(cohort.total_cost)}
                  </td>
                  <td className="p-4 text-white/90">
                    {formatCurrency(cohort.avg_cost)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-warning" />
                      <span className="text-white/80">{cohort.avg_los.toFixed(1)}d</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cohort.readmission_rate > 15 ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>
                      {cohort.readmission_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-4">
                    <Link 
                      href={`/population?diag_1=${encodeURIComponent(cohort.diag_1)}`}
                      className="flex items-center gap-1 text-xs text-brand-cyan hover:text-white transition-colors"
                    >
                      Drill-down
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

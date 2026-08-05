'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, Activity, ExternalLink, Eye } from 'lucide-react';

interface DiseaseData {
  disease: string;
  total_patients: number;
  readmission_rate: number;
  avg_los: number;
  avg_meds: number;
  female_count: number;
  male_count: number;
  avg_age: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  trendIndicator: 'up' | 'down' | 'flat' | string;
}

interface DiseaseTableProps {
  data: DiseaseData[];
  cohortTotal: number;
}

export function DiseaseTable({ data, cohortTotal }: DiseaseTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-white/50 bg-surface-black border border-border-glass rounded-xl" role="region" aria-label="Disease Intelligence Empty State" tabIndex={0}>
        <Activity className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No disease data available for this cohort.</p>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'Critical': return 'text-danger bg-danger/10 border-danger/20';
      case 'High': return 'text-warning bg-warning/10 border-warning/20';
      case 'Medium': return 'text-brand-teal bg-brand-teal/10 border-brand-teal/20';
      default: return 'text-success bg-success/10 border-success/20';
    }
  };

  return (
    <div className="bg-surface-obsidian border border-border-glass rounded-xl overflow-hidden" role="region" aria-label="Disease Intelligence Table">
      <div className="p-4 border-b border-border-glass bg-surface-black/50">
        <h3 className="text-sm font-semibold text-white">Disease Intelligence (Top 20)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-white/50 uppercase bg-surface-black/30">
            <tr>
              <th className="px-4 py-3 font-medium">Diagnosis</th>
              <th className="px-4 py-3 font-medium text-right">Patients</th>
              <th className="px-4 py-3 font-medium text-center w-24">Pop %</th>
              <th className="px-4 py-3 font-medium text-right">Avg Age</th>
              <th className="px-4 py-3 font-medium text-center">Gender Dist (F/M)</th>
              <th className="px-4 py-3 font-medium text-right">Readmission %</th>
              <th className="px-4 py-3 font-medium text-right">Avg LOS</th>
              <th className="px-4 py-3 font-medium text-right">Avg Meds</th>
              <th className="px-4 py-3 font-medium text-center">Risk Level</th>
              <th className="px-4 py-3 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-glass">
            {data.map((row, idx) => {
              const popPercent = cohortTotal > 0 ? (row.total_patients / cohortTotal) * 100 : 0;
              const totalGender = row.female_count + row.male_count;
              const femalePercent = totalGender > 0 ? (row.female_count / totalGender) * 100 : 0;
              const malePercent = totalGender > 0 ? (row.male_count / totalGender) * 100 : 0;

              return (
                <tr key={idx} className="hover:bg-white/5 transition-colors focus-within:bg-white/10">
                  <td className="px-4 py-3 font-medium text-white/90 truncate max-w-[150px]" title={row.disease}>
                    {row.disease}
                  </td>
                  <td className="px-4 py-3 text-right text-white/80">
                    {row.total_patients.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-white/70">{popPercent.toFixed(1)}%</span>
                      <div className="w-full bg-surface-black h-1.5 rounded-full overflow-hidden" aria-label={`${popPercent.toFixed(1)}% of population`}>
                        <div className="bg-brand-cyan h-full rounded-full" style={{ width: `${Math.min(popPercent, 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white/80">
                    {row.avg_age.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-1 w-24 mx-auto" aria-label={`Gender Distribution: ${femalePercent.toFixed(0)}% Female, ${malePercent.toFixed(0)}% Male`}>
                      <div className="flex justify-between w-full text-[10px] text-white/50">
                        <span>F: {femalePercent.toFixed(0)}%</span>
                        <span>M: {malePercent.toFixed(0)}%</span>
                      </div>
                      <div className="w-full flex h-1.5 rounded-full overflow-hidden">
                        <div className="bg-pink-500/80 h-full" style={{ width: `${femalePercent}%` }} />
                        <div className="bg-blue-500/80 h-full" style={{ width: `${malePercent}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {row.trendIndicator === 'up' ? <ArrowUpRight className="h-3 w-3 text-danger" /> : <ArrowDownRight className="h-3 w-3 text-success" />}
                      <span className={row.readmission_rate > 15 ? 'text-danger' : 'text-success'}>
                        {row.readmission_rate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white/80">
                    {row.avg_los.toFixed(1)}d
                  </td>
                  <td className="px-4 py-3 text-right text-white/80">
                    {row.avg_meds.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border ${getRiskColor(row.riskLevel)}`}>
                      {row.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button 
                        onClick={() => window.location.href = `/population/cohort?diag_1=${encodeURIComponent(row.disease)}`}
                        className="text-brand-cyan/50 hover:text-brand-cyan transition-colors" 
                        aria-label={`Quick view ${row.disease}`}
                        title="Quick View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <Link 
                        href={`/population/cohort?diag_1=${encodeURIComponent(row.disease)}`}
                        className="text-brand-cyan/50 hover:text-brand-cyan transition-colors"
                        aria-label={`Drill down into ${row.disease} cohort`}
                        title="Drill-down"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

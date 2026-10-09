'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Pill, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useCrossFilter } from '@/lib/useCrossFilter';

interface MedicationQualityProps {
  data: {
    avgMeds: number;
    polypharmacyPercent: number;
    byAge: { age: string; avg_meds: number }[];
    byDiagnosis: { diag_1: string; avg_meds: number; count: number }[];
  };
}

export function MedicationQuality({ data }: MedicationQualityProps) {
  const { getCrossFilterUrl } = useCrossFilter();

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-white/50 text-xs uppercase tracking-wider mb-1">Avg Medication Burden</span>
          <span className="text-3xl font-bold text-white">
            {data.avgMeds.toFixed(1)} <span className="text-sm text-white/50 font-normal">meds/patient</span>
          </span>
        </Card>
        <Card className={`p-4 flex flex-col items-center justify-center text-center ${data.polypharmacyPercent > 20 ? 'border-brand-orange/50 bg-brand-orange/5' : ''}`}>
          <span className="text-white/50 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
            {data.polypharmacyPercent > 20 && <AlertTriangle className="h-3 w-3 text-brand-orange" />}
            Polypharmacy (15+ Meds)
          </span>
          <span className={`text-3xl font-bold ${data.polypharmacyPercent > 20 ? 'text-brand-orange' : 'text-white'}`}>
            {data.polypharmacyPercent.toFixed(1)}%
          </span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Pill className="h-4 w-4 text-brand-cyan" />
            Burden by Age
          </h3>
          <div className="space-y-3">
            {data.byAge.map((row, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-white/80 w-24">{row.age}</span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-surface-black h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${row.avg_meds > 15 ? 'bg-brand-orange' : 'bg-brand-cyan'}`}
                      style={{ width: `${Math.min((row.avg_meds / 30) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-white text-right w-12">
                  {row.avg_meds.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-brand-orange" />
            High Risk Cohorts (by Diagnosis)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-white/50 border-b border-white/10">
                <tr>
                  <th className="pb-2 font-medium">Diagnosis</th>
                  <th className="pb-2 font-medium text-right">Encounters</th>
                  <th className="pb-2 font-medium text-right">Avg Meds</th>
                  <th className="pb-2 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.byDiagnosis.map((row, idx) => (
                  <tr key={idx} className={`hover:bg-white/[0.02] transition-colors ${row.avg_meds >= 15 ? 'bg-brand-orange/5' : ''}`}>
                    <td className="py-2 text-white/90">{row.diag_1}</td>
                    <td className="py-2 text-right text-white/70">{row.count}</td>
                    <td className={`py-2 text-right font-medium ${row.avg_meds >= 15 ? 'text-brand-orange' : 'text-white'}`}>
                      {row.avg_meds.toFixed(1)}
                    </td>
                    <td className="py-2 text-center">
                      <Link
                        href={getCrossFilterUrl('diag_1', row.diag_1)}
                        className="inline-flex items-center justify-center w-6 h-6 rounded text-white/40 hover:text-brand-orange hover:bg-brand-orange/10 transition-colors"
                        title="Filter by Diagnosis"
                        aria-label={`Filter by ${row.diag_1}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

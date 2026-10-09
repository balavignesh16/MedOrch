'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, ExternalLink, Activity, Target } from 'lucide-react';
import Link from 'next/link';
import { useCrossFilter } from '@/lib/useCrossFilter';

interface ReadmissionData {
  category: string;
  count: number;
  readmitted: number;
}

interface ReadmissionIntelligenceProps {
  data: {
    distribution: { bucket: string; count: number }[];
    byAge: ReadmissionData[];
    byGender: ReadmissionData[];
    byRace: ReadmissionData[];
    byDiagnosis: ReadmissionData[];
    byAdmissionType: ReadmissionData[];
    byDischargeDisposition: ReadmissionData[];
  };
  totalPatients: number;
}

const READMISSION_TABS = ['Diagnosis', 'Age', 'Gender', 'Race', 'Admission', 'Discharge'] as const;
type ReadmissionTab = typeof READMISSION_TABS[number];

export function ReadmissionIntelligence({ data, totalPatients }: ReadmissionIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<ReadmissionTab>('Diagnosis');
  const { getCrossFilterUrl } = useCrossFilter();

  const getTabDataset = () => {
    switch (activeTab) {
      case 'Age': return { dataset: data.byAge, filterParam: 'age' };
      case 'Gender': return { dataset: data.byGender, filterParam: 'gender' };
      case 'Race': return { dataset: data.byRace, filterParam: 'race' };
      case 'Diagnosis': return { dataset: data.byDiagnosis, filterParam: 'diag_1' };
      case 'Admission': return { dataset: data.byAdmissionType, filterParam: 'admission_type_id' };
      case 'Discharge': return { dataset: data.byDischargeDisposition, filterParam: 'discharge_disposition_id' };
      default: return { dataset: data.byDiagnosis, filterParam: 'diag_1' };
    }
  };

  const { dataset, filterParam } = getTabDataset();

  const targetRate = 10.0; // Configured demonstration reference
  const benchmarkRate = 15.2; // Configured comparison reference

  return (
    <Card className="p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-orange" />
            Readmission Proxy Intelligence
          </h2>
          <p className="text-sm text-white/50">Analyze the source dataset&apos;s &lt;30-day proxy category across encounter dimensions.</p>
        </div>

        <div className="flex bg-surface-black p-1 rounded-lg border border-border-glass overflow-x-auto">
          {READMISSION_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-brand-orange text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              By {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-white/50 uppercase bg-surface-black border-y border-white/5">
            <tr>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold text-right">Total Encounters</th>
              <th className="px-4 py-3 font-semibold text-right">&lt;30-Day Proxy %</th>
              <th className="px-4 py-3 font-semibold text-center">Demo Reference</th>
              <th className="px-4 py-3 font-semibold text-center">Comparison Reference</th>
              <th className="px-4 py-3 font-semibold text-right">Variance</th>
              <th className="px-4 py-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {dataset.map((row, idx) => {
              const rate = row.count > 0 ? (row.readmitted / row.count) * 100 : 0;
              const variance = rate - targetRate;
              const varianceColor = variance > 0 ? 'text-danger' : 'text-success';
              const varianceIcon = variance > 0 ? <ArrowUpRight className="h-3 w-3 inline" /> : <ArrowDownRight className="h-3 w-3 inline" />;
              
              return (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-white/90">
                    {row.category || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.count.toLocaleString()}
                    <div className="text-[10px] text-white/40 mt-0.5">
                      {((row.count / totalPatients) * 100).toFixed(1)}% of total
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`font-medium ${rate > 15 ? 'text-danger' : rate > targetRate ? 'text-brand-orange' : 'text-success'}`}>
                        {rate.toFixed(1)}%
                      </span>
                      <div className="w-16 bg-surface-black h-1.5 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${rate > 15 ? 'bg-danger' : rate > targetRate ? 'bg-brand-orange' : 'bg-success'}`}
                          style={{ width: `${Math.min(rate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-white/60">
                    <Target className="h-3 w-3 inline mr-1 opacity-50"/>
                    {targetRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center text-white/60">
                    {benchmarkRate.toFixed(1)}%
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${varianceColor}`}>
                    {varianceIcon}
                    {Math.abs(variance).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={getCrossFilterUrl(filterParam, row.category)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:text-brand-cyan hover:bg-brand-cyan/10 transition-colors"
                      title="Drill-down"
                      aria-label={`Drill-down into ${row.category}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

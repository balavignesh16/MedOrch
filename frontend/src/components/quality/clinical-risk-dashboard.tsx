'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useCrossFilter } from '@/lib/useCrossFilter';

interface ClinicalRiskProps {
  data: {
    total: number;
    distribution: {
      Low: { count: number; drivers: string[] };
      Medium: { count: number; drivers: string[] };
      High: { count: number; drivers: string[] };
      Critical: { count: number; drivers: string[] };
    };
  };
}

export function ClinicalRiskDashboard({ data }: ClinicalRiskProps) {
  const { getCrossFilterUrl } = useCrossFilter();

  const riskLevels = [
    { 
      name: 'Critical',
      color: 'bg-danger text-danger border-danger/30',
      data: data.distribution.Critical,
      action: 'Mandatory 48hr multidisciplinary review'
    },
    { 
      name: 'High',
      color: 'bg-brand-orange text-brand-orange border-brand-orange/30',
      data: data.distribution.High,
      action: 'Assign to care management program'
    },
    { 
      name: 'Medium',
      color: 'bg-brand-purple text-brand-purple border-brand-purple/30',
      data: data.distribution.Medium,
      action: 'Monitor via telehealth check-ins'
    },
    { 
      name: 'Low',
      color: 'bg-success text-success border-success/30',
      data: data.distribution.Low,
      action: 'Standard clinical protocols'
    }
  ];

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-brand-purple" />
        Clinical Risk Stratification
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {riskLevels.map((risk) => {
          const percent = data.total > 0 ? (risk.data.count / data.total) * 100 : 0;
          
          return (
            <div key={risk.name} className="border border-white/10 rounded-xl p-4 bg-surface-black flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-block px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border ${risk.color.replace('text-', 'text-').replace('bg-', 'bg-opacity-10 ')}`}>
                    {risk.name}
                  </span>
                  <Link
                    href={getCrossFilterUrl('riskLevel', risk.name)}
                    className="text-white/40 hover:text-brand-cyan transition-colors"
                    title={`Drill-down into ${risk.name} cohort`}
                    aria-label={`Drill-down into ${risk.name} cohort`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mb-4">
                  <div className="text-2xl font-bold text-white">{risk.data.count.toLocaleString()} <span className="text-sm text-white/50 font-normal">pts</span></div>
                  <div className="text-sm font-medium text-white/70">{percent.toFixed(1)}% of Population</div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">Primary Drivers</span>
                    <ul className="text-xs text-white/80 space-y-1 list-disc list-inside">
                      {risk.data.drivers.map((driver, i) => (
                        <li key={i}>{driver}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">Suggested Action</span>
                <p className="text-xs text-white/90">{risk.action}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

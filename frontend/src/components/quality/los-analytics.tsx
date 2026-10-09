'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useCrossFilter } from '@/lib/useCrossFilter';

interface LosAnalyticsProps {
  data: {
    stats: { avg_los: number; max_los: number; min_los: number; median_los: number };
    distribution: { los: number; count: number }[];
    topCohorts: { diag_1: string; avg_los: number; count: number }[];
    lowestCohorts: { diag_1: string; avg_los: number; count: number }[];
    outliersCount: number;
  };
}

export function LosAnalytics({ data }: LosAnalyticsProps) {
  const { getCrossFilterUrl } = useCrossFilter();

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-white/50 text-xs uppercase tracking-wider mb-1">Average LOS</span>
          <span className="text-2xl font-bold text-white">{data.stats.avg_los.toFixed(1)}d</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-white/50 text-xs uppercase tracking-wider mb-1">Median LOS</span>
          <span className="text-2xl font-bold text-white">{data.stats.median_los.toFixed(1)}d</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-white/50 text-xs uppercase tracking-wider mb-1">Minimum</span>
          <span className="text-2xl font-bold text-success">{data.stats.min_los}d</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-white/50 text-xs uppercase tracking-wider mb-1">Maximum</span>
          <span className="text-2xl font-bold text-danger">{data.stats.max_los}d</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-white/50 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Outliers (&gt;10d)
          </span>
          <span className="text-2xl font-bold text-brand-orange">{data.outliersCount.toLocaleString()}</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-danger" />
            Top 10 Longest Stay Cohorts
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-white/50 border-b border-white/10">
                <tr>
                  <th className="pb-2 font-medium">Diagnosis</th>
                  <th className="pb-2 font-medium text-right">Encounters</th>
                  <th className="pb-2 font-medium text-right">Avg LOS</th>
                  <th className="pb-2 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.topCohorts.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 text-white/90">{row.diag_1}</td>
                    <td className="py-2 text-right text-white/70">{row.count}</td>
                    <td className="py-2 text-right text-danger font-medium">{row.avg_los.toFixed(1)}d</td>
                    <td className="py-2 text-center">
                      <Link
                        href={getCrossFilterUrl('diag_1', row.diag_1)}
                        className="inline-flex items-center justify-center w-6 h-6 rounded text-white/40 hover:text-brand-cyan hover:bg-brand-cyan/10 transition-colors"
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

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-success" />
            Top 10 Lowest Stay Cohorts
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-white/50 border-b border-white/10">
                <tr>
                  <th className="pb-2 font-medium">Diagnosis</th>
                  <th className="pb-2 font-medium text-right">Encounters</th>
                  <th className="pb-2 font-medium text-right">Avg LOS</th>
                  <th className="pb-2 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.lowestCohorts.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 text-white/90">{row.diag_1}</td>
                    <td className="py-2 text-right text-white/70">{row.count}</td>
                    <td className="py-2 text-right text-success font-medium">{row.avg_los.toFixed(1)}d</td>
                    <td className="py-2 text-center">
                      <Link
                        href={getCrossFilterUrl('diag_1', row.diag_1)}
                        className="inline-flex items-center justify-center w-6 h-6 rounded text-white/40 hover:text-brand-cyan hover:bg-brand-cyan/10 transition-colors"
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

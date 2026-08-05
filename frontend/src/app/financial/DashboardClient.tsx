'use client';

import React, { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { FilterChips } from '@/components/dashboard/filter-chips';
import { FinancialKpiGrid } from '@/components/financial/financial-kpi-grid';
import { CostIntelligence } from '@/components/financial/cost-intelligence';
import { ResourceUtilization } from '@/components/financial/resource-utilization';
import { HighCostCohorts } from '@/components/financial/high-cost-cohorts';
import { FinancialTrends } from '@/components/financial/financial-trends';
import { CostBreakdown } from '@/components/financial/cost-breakdown';
import { FinancialInsights } from '@/components/financial/financial-insights';

interface DashboardClientProps {
  filters: any;
  overviewData: any;
  costIntellData: any;
  resourceData: any;
  cohortsData: any;
  trendsData: any;
  insightsData: any;
  totalPatients: number;
}

export function DashboardClient({
  filters,
  overviewData,
  costIntellData,
  resourceData,
  cohortsData,
  trendsData,
  insightsData,
  totalPatients
}: DashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateQueryParams = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <FilterChips  />
      
      {/* Top Section: KPIs and Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        <div className="xl:col-span-3 space-y-6">
          <FinancialKpiGrid overview={overviewData} />
          <CostIntelligence data={costIntellData} onFilterChange={updateQueryParams} />
        </div>
        <div className="xl:col-span-1">
          <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Actionable Insights</h3>
          <FinancialInsights insights={insightsData} />
          <CostBreakdown overview={overviewData} />
        </div>
      </div>

      {/* Middle Section: Trends and Resources */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FinancialTrends data={trendsData} />
        <ResourceUtilization data={resourceData} totalCost={overviewData.totalCost} />
      </div>

      {/* Bottom Section: High Cost Cohorts */}
      <HighCostCohorts data={cohortsData} totalPatients={totalPatients} />
    </div>
  );
}

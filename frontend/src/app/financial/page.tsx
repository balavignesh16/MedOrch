import React from 'react';
import { FinancialFilterState } from '@/lib/financialLogic';
import {
  getFinancialOverview,
  getCostIntelligence,
  getResourceUtilization,
  getHighCostCohorts,
  getFinancialTrends,
  getFinancialInsights
} from '@/app/actions/financialDb';
import { DashboardClient } from './DashboardClient';

interface FinancialPageProps {
  searchParams: Promise<FinancialFilterState>;
}

export default async function FinancialPage(props: FinancialPageProps) {
  const searchParams = await props.searchParams;
  const filters = searchParams || {};

  // Execute all queries in parallel for maximum performance (React Cache will dedup if necessary)
  const [
    overviewData,
    costIntellData,
    resourceData,
    cohortsData,
    trendsData,
    insightsData
  ] = await Promise.all([
    getFinancialOverview(filters),
    getCostIntelligence(filters),
    getResourceUtilization(filters),
    getHighCostCohorts(filters),
    getFinancialTrends(filters),
    getFinancialInsights(filters)
  ]);

  return (
    <DashboardClient
      filters={filters}
      overviewData={overviewData}
      costIntellData={costIntellData}
      resourceData={resourceData}
      cohortsData={cohortsData}
      trendsData={trendsData}
      insightsData={insightsData}
      totalPatients={0} // We might need to fetch total patients for the whole dataset or just use the cohort length, but for now we'll pass 0 or a better number. Actually getFinancialOverview doesn't return total patients. Let's update financialLogic to return totalPatients.
    />
  );
}

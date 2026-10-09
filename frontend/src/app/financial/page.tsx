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
      overviewData={overviewData}
      costIntellData={costIntellData}
      resourceData={resourceData}
      cohortsData={cohortsData}
      trendsData={trendsData}
      insightsData={insightsData}
      totalPatients={overviewData.totalPatients ?? 0}
    />
  );
}

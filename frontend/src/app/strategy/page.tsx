import React, { Suspense } from 'react';
import { DashboardClient } from './DashboardClient';
import {
  getStrategicOverview,
  getEnterpriseBenchmarkProfiles,
  getStrategicKpiMatrix,
  getDecisionPrioritizationMatrix,
  getStrategicRoadmap,
  getStrategicExecutiveBrief
} from '@/app/actions/strategyDb';

export const dynamic = 'force-dynamic';

export default async function StrategyDashboardPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const filters = {
    time_period: typeof searchParams.time_period === 'string' ? searchParams.time_period : undefined,
    facility: typeof searchParams.facility === 'string' ? searchParams.facility : undefined,
  };

  // Use Promise.all to fetch all dashboard data concurrently based on URL params
  const [
    overviewData,
    benchmarkData,
    kpiMatrixData,
    decisionMatrixData,
    roadmapData,
    executiveBriefData
  ] = await Promise.all([
    getStrategicOverview(filters),
    getEnterpriseBenchmarkProfiles(filters),
    getStrategicKpiMatrix(filters),
    getDecisionPrioritizationMatrix(filters),
    getStrategicRoadmap(filters),
    getStrategicExecutiveBrief(filters)
  ]);

  return (
    <div className="space-y-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Enterprise Strategy & Decision Intelligence Hub
            </h1>
            <p className="text-white/60 max-w-2xl">
              Executive decision-support platform for organizational benchmarking, scenario analysis, KPI forecasting, and strategic roadmapping.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full text-brand-cyan text-xs font-bold uppercase tracking-wider">
              Strategic Benchmarking Model (Analytical)
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="h-96 flex items-center justify-center text-brand-teal">Loading Strategic Intelligence Engine...</div>}>
        <DashboardClient 
          filters={filters}
          overviewData={overviewData}
          benchmarkData={benchmarkData}
          kpiMatrixData={kpiMatrixData}
          decisionMatrixData={decisionMatrixData}
          roadmapData={roadmapData}
          executiveBriefData={executiveBriefData}
        />
      </Suspense>
    </div>
  );
}

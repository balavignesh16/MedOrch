import React from 'react';
import { CommandPalette } from '@/components/ui/command-palette';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';
import { FilterChips } from '@/components/dashboard/filter-chips';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Users, AlertTriangle, Clock, Pill, Activity } from 'lucide-react';

import { 
  getPopulationOverview,
  getDiseaseIntelligence,
  getRiskSegments,
  getPopulationTrends,
  getPopulationInsights
} from '@/app/actions/populationDb';

import { CohortExplorer } from '@/components/population/cohort-explorer';
import { DiseaseTable } from '@/components/population/disease-table';
import { RiskCharts } from '@/components/population/risk-charts';
import { PopulationTrends } from '@/components/population/population-trends';
import { PopulationInsights } from '@/components/population/population-insights';
import { PopulationEmptyState } from '@/components/population/population-empty-state';
import { flattenSearchParams, RawSearchParams } from '@/lib/searchParams';

export const dynamic = 'force-dynamic';

const HEURISTIC_METADATA = { lastUpdated: 'Bundled dataset', dataSource: 'Rule-based demo model', refreshPolicy: 'On page load', confidence: 'Not validated', target: 'Demo only' };
const DERIVED_METADATA = { lastUpdated: 'Bundled dataset', dataSource: 'De-identified demo data', refreshPolicy: 'On page load', confidence: 'Derived', target: 'Demo only' };

export default async function PopulationDashboardPage(props: { searchParams: Promise<RawSearchParams> }) {
  const searchParams = await props.searchParams;
  const safeParams = flattenSearchParams(searchParams);

  // Fetch all parallel data streams
  const [
    overview, 
    disease,
    riskSegments,
    trends,
    insights
  ] = await Promise.all([
    getPopulationOverview(safeParams),
    getDiseaseIntelligence(safeParams),
    getRiskSegments(safeParams),
    getPopulationTrends(safeParams),
    getPopulationInsights(safeParams)
  ]);

  if (overview.totalPatients === 0) {
    return (
      <div className="min-h-screen bg-surface-black text-white selection:bg-brand-cyan/30 flex flex-col">
        <CommandPalette />
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <DashboardHeader 
            title="Population Health Analytics"
            description="Enterprise Patient Cohort & Risk Segmentation"
            showDatePicker={false}
          />
          <FilterChips  />
          <CohortExplorer key={new URLSearchParams(safeParams).toString()} totalPatients={0} absoluteTotal={overview.absoluteTotal} />
          <PopulationEmptyState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-black text-white selection:bg-brand-cyan/30 flex flex-col">
      <CommandPalette />
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <DashboardHeader 
          title="Population Health Analytics"
          description="Enterprise Patient Cohort & Risk Segmentation"
          showDatePicker={false}
        />
        
        <FilterChips  />
        
        <CohortExplorer key={new URLSearchParams(safeParams).toString()} totalPatients={overview.totalPatients} absoluteTotal={overview.absoluteTotal} />

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard
            title="Population Health Index"
            value={`${overview.healthIndex.toFixed(0)}/100`}
            status={overview.healthIndex > 70 ? 'Good' : overview.healthIndex > 50 ? 'Watch' : 'Critical'}
            icon={<Activity className="h-4 w-4" />}
            widgetSize="sm"
            metadata={HEURISTIC_METADATA}
          />
          <KpiCard
            title="Total Encounters"
            value={overview.totalPatients.toLocaleString()}
            icon={<Users className="h-4 w-4" />}
            widgetSize="sm"
            metadata={{
              lastUpdated: 'Bundled dataset',
              dataSource: 'De-identified demo data',
              refreshPolicy: 'On page load',
              confidence: 'Observed',
              target: 'N/A',
            }}
          />
          <KpiCard
            title="High Risk Cohort"
            value={`${overview.highRiskPercent.toFixed(1)}%`}
            status={overview.highRiskPercent > 30 ? 'Critical' : 'Good'}
            icon={<AlertTriangle className="h-4 w-4" />}
            widgetSize="sm"
            metadata={HEURISTIC_METADATA}
          />
          <KpiCard
            title="Avg Length of Stay"
            value={`${overview.avgLengthOfStay.toFixed(1)}d`}
            status={overview.avgLengthOfStay > 5 ? 'Watch' : 'Good'}
            icon={<Clock className="h-4 w-4" />}
            widgetSize="sm"
            metadata={DERIVED_METADATA}
          />
          <KpiCard
            title="Avg Medications / Encounter"
            value={overview.avgMedications.toFixed(1)}
            status={overview.avgMedications > 15 ? 'Watch' : 'Good'}
            icon={<Pill className="h-4 w-4" />}
            widgetSize="sm"
            metadata={DERIVED_METADATA}
          />
        </div>

        {/* Risk Segmentation */}
        <RiskCharts distribution={riskSegments.distribution} pyramid={riskSegments.pyramid} />

        {/* Insights & Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <PopulationInsights insights={insights} />
          </div>
          <div className="lg:col-span-2">
            <PopulationTrends data={trends} />
          </div>
        </div>

        {/* Disease Intelligence */}
        <div className="mb-6">
          <DiseaseTable data={disease} cohortTotal={overview.totalPatients} />
        </div>

      </main>

      <DashboardFooter 
        datasetVersion="UCI Diabetes 130-US (1999–2008)"
        recordsLoaded={overview.totalPatients}
        environment="Development demo"
      />
    </div>
  );
}

import React, { Suspense } from 'react';
import { CommandPalette } from '@/components/ui/command-palette';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';
import { FilterChips } from '@/components/dashboard/filter-chips';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
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

export const dynamic = 'force-dynamic';

export default async function PopulationDashboardPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const safeParams = searchParams ? Object.fromEntries(Object.entries(searchParams)) : {};

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
          <CohortExplorer totalPatients={0} absoluteTotal={overview.absoluteTotal} />
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
        
        <CohortExplorer totalPatients={overview.totalPatients} absoluteTotal={overview.absoluteTotal} />

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard
            title="Population Health Index"
            value={`${overview.healthIndex.toFixed(0)}/100`}
            status={overview.healthIndex > 70 ? 'Good' : overview.healthIndex > 50 ? 'Watch' : 'Critical'}
            icon={<Activity className="h-4 w-4" />}
            widgetSize="sm"
            metadata={{
              lastUpdated: 'Live',
              dataSource: 'MedOrch Clinical Engine',
              refreshPolicy: 'Real-time',
              confidence: '95%',
              target: '> 80',
            }}
          />
          <KpiCard
            title="Total Patients"
            value={overview.totalPatients.toLocaleString()}
            icon={<Users className="h-4 w-4" />}
            widgetSize="sm"
            metadata={{
              lastUpdated: 'Live',
              dataSource: 'EMR / HL7',
              refreshPolicy: 'Real-time',
              confidence: '99%',
              target: 'N/A',
            }}
          />
          <KpiCard
            title="High Risk Cohort"
            value={`${overview.highRiskPercent.toFixed(1)}%`}
            status={overview.highRiskPercent > 30 ? 'Critical' : 'Good'}
            icon={<AlertTriangle className="h-4 w-4" />}
            widgetSize="sm"
            metadata={{
              lastUpdated: 'Live',
              dataSource: 'Risk Engine',
              refreshPolicy: 'Real-time',
              confidence: '85%',
              target: '< 20%',
            }}
          />
          <KpiCard
            title="Avg Length of Stay"
            value={`${overview.avgLengthOfStay.toFixed(1)}d`}
            status={overview.avgLengthOfStay > 5 ? 'Watch' : 'Good'}
            icon={<Clock className="h-4 w-4" />}
            widgetSize="sm"
            metadata={{
              lastUpdated: 'Live',
              dataSource: 'Admissions',
              refreshPolicy: 'Real-time',
              confidence: '99%',
              target: '< 4d',
            }}
          />
          <KpiCard
            title="Avg Meds / Patient"
            value={overview.avgMedications.toFixed(1)}
            status={overview.avgMedications > 15 ? 'Watch' : 'Good'}
            icon={<Pill className="h-4 w-4" />}
            widgetSize="sm"
            metadata={{
              lastUpdated: 'Live',
              dataSource: 'Pharmacy System',
              refreshPolicy: 'Real-time',
              confidence: '99%',
              target: '< 10',
            }}
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
          <DiseaseTable data={disease} />
        </div>

      </main>

      <DashboardFooter 
        datasetVersion="v3.0.0-POP"
        recordsLoaded={overview.totalPatients}
        environment="Development (Sprint 3)"
      />
    </div>
  );
}

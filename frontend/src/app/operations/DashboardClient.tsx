'use client';

import React from 'react';
import { FilterChips } from '@/components/dashboard/filter-chips';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { OperationalKpiGrid } from '@/components/operations/operational-kpi-grid';
import { PatientFlowDashboard } from '@/components/operations/patient-flow-dashboard';
import { CapacityDashboard } from '@/components/operations/capacity-dashboard';
import { BottleneckIntelligence } from '@/components/operations/bottleneck-intelligence';
import { OperationalResources } from '@/components/operations/operational-resources';
import { OperationalTrends } from '@/components/operations/operational-trends';
import { OperationalInsights } from '@/components/operations/operational-insights';

interface DashboardClientProps {
  filters: any;
  overviewData: any;
  flowData: any;
  resourcesData: any;
  capacityData: any;
  bottlenecksData: any;
  trendsData: any;
  insightsData: any;
}

export function DashboardClient({ 
  filters, 
  overviewData, 
  flowData,
  resourcesData,
  capacityData,
  bottlenecksData,
  trendsData,
  insightsData
}: DashboardClientProps) {

  return (
    <div className="min-h-screen bg-black/95">
      {/* Global Header */}
      <header className="border-b border-white/5 bg-surface-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="px-6 py-4 max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Breadcrumb 
              items={[
                { label: 'MedOrch', href: '/' },
                { label: 'Executive Command Center', href: '/' }
              ]}
            />
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Operational Intelligence</h1>
              <p className="text-sm text-white/50">
                Real-time operational efficiency, capacity, and patient flow dynamics.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        <FilterChips  />
        
        <OperationalKpiGrid overview={overviewData} />

        <PatientFlowDashboard flowData={flowData} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CapacityDashboard metrics={capacityData} />
          <BottleneckIntelligence bottlenecks={bottlenecksData} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <OperationalTrends trends={trendsData} />
          </div>
          <div className="xl:col-span-1">
            <OperationalInsights insights={insightsData} />
          </div>
        </div>

        <OperationalResources resources={resourcesData} />
      </div>
    </div>
  );
}

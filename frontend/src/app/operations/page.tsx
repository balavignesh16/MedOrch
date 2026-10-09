import React from 'react';
import { DashboardClient } from './DashboardClient';
import { 
  getOperationalOverview, 
  getPatientFlow, 
  getOperationalResources, 
  getCapacityMetrics, 
  getBottlenecks, 
  getOperationalTrends, 
  getOperationalInsights 
} from '@/app/actions/operationalDb';

export default async function OperationsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  // Run all queries in parallel for performance (no N+1)
  const [overview, flow, resources, capacity, bottlenecks, trends, insights] = await Promise.all([
    getOperationalOverview(searchParams),
    getPatientFlow(searchParams),
    getOperationalResources(searchParams),
    getCapacityMetrics(searchParams),
    getBottlenecks(searchParams),
    getOperationalTrends(searchParams),
    getOperationalInsights(searchParams)
  ]);

  return (
    <DashboardClient 
      overviewData={overview} 
      flowData={flow}
      resourcesData={resources}
      capacityData={capacity}
      bottlenecksData={bottlenecks}
      trendsData={trends}
      insightsData={insights}
    />
  );
}

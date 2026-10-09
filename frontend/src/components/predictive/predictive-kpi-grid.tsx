import React from 'react';
import type { fetchPredictionOverview } from '@/lib/predictiveLogic';
import { KpiCard } from '@/components/dashboard/kpi-card';

interface PredictiveKpiGridProps {
  overview: Awaited<ReturnType<typeof fetchPredictionOverview>>;
}

export const PredictiveKpiGrid: React.FC<PredictiveKpiGridProps> = ({ overview }) => {
  const metadata = {
    dataSource: 'MedOrch AI Engine',
    lastUpdated: new Date().toISOString().split('T')[0],
    refreshPolicy: 'Real-time',
    confidence: 'High',
    target: 'Optimal'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Predictive Health Score"
        value={overview.healthScore}
        trend={{ value: 2.1, direction: 'up', period: 'last week' }}
        metadata={metadata}
        description="Composite risk score for all active patients."
      />
      <KpiCard
        title="Expected Readmissions"
        value={overview.expectedReadmissions.toLocaleString()}
        trend={{ value: 1.5, direction: 'down', period: 'last month' }}
        metadata={metadata}
        description="Predicted 30-day readmissions next 30 days."
      />
      <KpiCard
        title="Predicted Avg LOS"
        value={`${overview.predictedAvgLos} d`}
        trend={{ value: 0.2, direction: 'down', period: 'last month' }}
        metadata={metadata}
        description="Forecasted average length of stay."
      />
      <KpiCard
        title="Demand Forecast Score"
        value={overview.demandScore}
        trend={{ value: 5.4, direction: 'up', period: 'last week' }}
        metadata={metadata}
        description="Resource strain prediction for the next 7 days."
      />
    </div>
  );
};

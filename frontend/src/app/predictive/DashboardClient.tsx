'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { PredictiveKpiGrid } from '@/components/predictive/predictive-kpi-grid';
import { HighRiskPatients } from '@/components/predictive/high-risk-patients';
import { PredictionDistribution } from '@/components/predictive/prediction-distribution';
import { FeatureImportanceChart } from '@/components/predictive/feature-importance';
import { DemandForecast } from '@/components/predictive/demand-forecast';
import { PredictiveInsights } from '@/components/predictive/predictive-insights';
import { InterventionCenter } from '@/components/predictive/intervention-center';
import { ModelExplainability } from '@/components/predictive/model-explainability';
import { PredictionLifecycle } from '@/components/predictive/prediction-lifecycle';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { FilterChips } from '@/components/dashboard/filter-chips';

interface DashboardClientProps {
  filters: any;
  overview: any;
  highRiskPatients: any[];
  predictionDistribution: any[];
  demandForecast: any[];
  interventions: any[];
  insights: any[];
  modelMetadata: any;
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  filters,
  overview,
  highRiskPatients,
  predictionDistribution,
  demandForecast,
  interventions,
  insights,
  modelMetadata
}) => {
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Predictive Analytics & AI"
        description="Machine learning-driven patient risk forecasting and demand prediction."
        showDatePicker={false}
      />
      <FilterChips />
      <PredictiveKpiGrid overview={overview} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HighRiskPatients patients={highRiskPatients} />
        </div>
        <div className="space-y-6">
          <ModelExplainability metadata={modelMetadata} explainability={overview.explainability} />
          <PredictiveInsights insights={insights} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PredictionDistribution distribution={predictionDistribution} />
            <FeatureImportanceChart />
          </div>
          <InterventionCenter interventions={interventions} />
        </div>
        <div className="space-y-6">
          <DemandForecast forecast={demandForecast} />
          <PredictionLifecycle />
        </div>
      </div>
    </div>
  );
};

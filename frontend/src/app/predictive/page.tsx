import React from 'react';
import { DashboardClient } from './DashboardClient';
import {
  getPredictionOverview,
  getHighRiskPatients,
  getPredictionDistribution,
  getDemandForecast,
  getInterventions,
  getPredictiveInsights
} from '@/app/actions/predictiveDb';
import { getModelMetadata } from '@/lib/ml/modelRegistry';
import type { PredictiveFilterState } from '@/lib/predictiveLogic';

export const dynamic = 'force-dynamic';

export default async function PredictivePage(props: { searchParams: Promise<PredictiveFilterState> }) {
  const searchParams = await props.searchParams;
  const filters = {
    timeframe: searchParams.timeframe || '30D',
    cohort: searchParams.cohort || 'All',
    department: searchParams.department || 'All',
    facility: searchParams.facility || 'All'
  };

  const [
    overview,
    highRiskPatients,
    predictionDistribution,
    demandForecast,
    interventions,
    insights
  ] = await Promise.all([
    getPredictionOverview(filters),
    getHighRiskPatients(filters),
    getPredictionDistribution(filters),
    getDemandForecast(filters),
    getInterventions(filters),
    getPredictiveInsights(filters)
  ]);

  const modelMetadata = getModelMetadata('readmission_v1') || {
    id: 'unknown', name: 'Unknown', version: '0', status: 'Active', owner: '', trainingDate: '', lastUpdated: '', supportedPredictionTypes: [], inputFeatures: [], outputType: 'Binary', accuracy: 0, confidenceRange: [0,0], fallbackStrategy: ''
  };

  return (
    <DashboardClient
      overview={overview}
      highRiskPatients={highRiskPatients}
      predictionDistribution={predictionDistribution}
      demandForecast={demandForecast}
      interventions={interventions}
      insights={insights}
      modelMetadata={modelMetadata}
    />
  );
}

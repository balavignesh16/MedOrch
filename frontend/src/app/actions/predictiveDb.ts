import { cache } from 'react';
import {
  fetchPredictionOverview,
  fetchHighRiskPatients,
  fetchPredictionDistribution,
  fetchDemandForecast,
  fetchInterventions,
  fetchMonitoringSummary,
  generatePredictiveInsights,
  PredictiveFilterState
} from '@/lib/predictiveLogic';

export const getPredictionOverview = cache(async (filters: PredictiveFilterState) => fetchPredictionOverview(filters));
export const getHighRiskPatients = cache(async (filters: PredictiveFilterState) => fetchHighRiskPatients(filters));
export const getPredictionDistribution = cache(async (filters: PredictiveFilterState) => fetchPredictionDistribution(filters));
export const getDemandForecast = cache(async (filters: PredictiveFilterState) => fetchDemandForecast(filters));
export const getInterventions = cache(async (filters: PredictiveFilterState) => fetchInterventions(filters));
export const getPredictiveInsights = cache(async (filters: PredictiveFilterState) => generatePredictiveInsights(filters));
export const getMonitoringSummary = cache(async () => fetchMonitoringSummary());

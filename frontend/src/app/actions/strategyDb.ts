'use server';

import {
  fetchStrategicOverview,
  fetchEnterpriseBenchmarkProfiles,
  fetchStrategicKpiMatrix,
  fetchDecisionPrioritizationMatrix,
  fetchStrategicRoadmap,
  getExecutiveBrief,
  StrategicFilterState
} from '@/lib/strategyLogic';

export async function getStrategicOverview(filters: StrategicFilterState = {}) {
  return fetchStrategicOverview(filters);
}

export async function getEnterpriseBenchmarkProfiles(filters: StrategicFilterState = {}) {
  return fetchEnterpriseBenchmarkProfiles(filters);
}

export async function getStrategicKpiMatrix(filters: StrategicFilterState = {}) {
  return fetchStrategicKpiMatrix(filters);
}

export async function getDecisionPrioritizationMatrix(filters: StrategicFilterState = {}) {
  return fetchDecisionPrioritizationMatrix(filters);
}

export async function getStrategicRoadmap(filters: StrategicFilterState = {}) {
  return fetchStrategicRoadmap(filters);
}

export async function getStrategicExecutiveBrief(filters: StrategicFilterState = {}) {
  return getExecutiveBrief(filters);
}

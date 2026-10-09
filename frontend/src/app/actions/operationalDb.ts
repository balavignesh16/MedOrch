'use server';

import {
  fetchOperationalOverview,
  fetchPatientFlow,
  fetchOperationalResources,
  fetchCapacityMetrics,
  fetchBottlenecks,
  fetchOperationalTrends,
  fetchOperationalInsights
} from '@/lib/operationalLogic';
import type { AnalyticsFilterState } from '@/lib/analytics';

export async function getOperationalOverview(filters: AnalyticsFilterState = {}) {
  return fetchOperationalOverview(filters);
}

export async function getPatientFlow(filters: AnalyticsFilterState = {}) {
  return fetchPatientFlow(filters);
}

export async function getOperationalResources(filters: AnalyticsFilterState = {}) {
  return fetchOperationalResources(filters);
}

export async function getCapacityMetrics(filters: AnalyticsFilterState = {}) {
  return fetchCapacityMetrics(filters);
}

export async function getBottlenecks(filters: AnalyticsFilterState = {}) {
  return fetchBottlenecks(filters);
}

export async function getOperationalTrends(filters: AnalyticsFilterState = {}) {
  return fetchOperationalTrends(filters);
}

export async function getOperationalInsights(filters: AnalyticsFilterState = {}) {
  return fetchOperationalInsights(filters);
}

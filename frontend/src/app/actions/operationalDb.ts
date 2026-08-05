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

export async function getOperationalOverview(filters: any = {}) {
  return fetchOperationalOverview(filters);
}

export async function getPatientFlow(filters: any = {}) {
  return fetchPatientFlow(filters);
}

export async function getOperationalResources(filters: any = {}) {
  return fetchOperationalResources(filters);
}

export async function getCapacityMetrics(filters: any = {}) {
  return fetchCapacityMetrics(filters);
}

export async function getBottlenecks(filters: any = {}) {
  return fetchBottlenecks(filters);
}

export async function getOperationalTrends(filters: any = {}) {
  return fetchOperationalTrends(filters);
}

export async function getOperationalInsights(filters: any = {}) {
  return fetchOperationalInsights(filters);
}

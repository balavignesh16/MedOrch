'use server';

import {
  fetchFinancialOverview,
  fetchCostIntelligence,
  fetchResourceUtilization,
  fetchHighCostCohorts,
  fetchFinancialTrends,
  generateFinancialInsights,
  FinancialFilterState
} from '@/lib/financialLogic';

export async function getFinancialOverview(filters: FinancialFilterState = {}) {
  return fetchFinancialOverview(filters);
}

export async function getCostIntelligence(filters: FinancialFilterState = {}) {
  return fetchCostIntelligence(filters);
}

export async function getResourceUtilization(filters: FinancialFilterState = {}) {
  return fetchResourceUtilization(filters);
}

export async function getHighCostCohorts(filters: FinancialFilterState = {}) {
  return fetchHighCostCohorts(filters);
}

export async function getFinancialTrends(filters: FinancialFilterState = {}) {
  return fetchFinancialTrends(filters);
}

export async function getFinancialInsights(filters: FinancialFilterState = {}) {
  return generateFinancialInsights(filters);
}

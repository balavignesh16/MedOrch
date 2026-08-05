'use server';

import {
  fetchPopulationOverview,
  fetchDiseaseIntelligence,
  fetchDemographics,
  fetchRiskSegments,
  fetchPopulationTrends,
  generatePopulationInsights,
  fetchCohortList,
  fetchPatientDetail,
  PopulationFilterState
} from '@/lib/populationLogic';

export async function getPopulationOverview(filters: PopulationFilterState = {}) {
  return fetchPopulationOverview(filters);
}

export async function getDiseaseIntelligence(filters: PopulationFilterState = {}) {
  return fetchDiseaseIntelligence(filters);
}

export async function getDemographics(filters: PopulationFilterState = {}) {
  return fetchDemographics(filters);
}

export async function getRiskSegments(filters: PopulationFilterState = {}) {
  return fetchRiskSegments(filters);
}

export async function getPopulationTrends(filters: PopulationFilterState = {}) {
  return fetchPopulationTrends(filters);
}

export async function getPopulationInsights(filters: PopulationFilterState = {}) {
  return generatePopulationInsights(filters);
}

export async function getCohortList(filters: PopulationFilterState = {}, page = 1, pageSize = 25, sortBy = 'patient_nbr', sortOrder = 'asc', searchQuery = '') {
  return fetchCohortList(filters, page, pageSize, sortBy, sortOrder, searchQuery);
}

export async function getPatientDetail(patient_nbr: string) {
  return fetchPatientDetail(patient_nbr);
}

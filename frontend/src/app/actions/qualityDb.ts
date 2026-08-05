'use server';

import {
  fetchQualityOverview,
  fetchReadmissionIntelligence,
  fetchLengthOfStayAnalytics,
  fetchMedicationQuality,
  fetchEmergencyInpatientAnalytics,
  fetchClinicalRisk,
  generateQualityInsights,
  fetchQualityTrends,
  QualityFilterState
} from '@/lib/qualityLogic';

export async function getQualityOverview(filters: QualityFilterState = {}) {
  return fetchQualityOverview(filters);
}

export async function getReadmissionIntelligence(filters: QualityFilterState = {}) {
  return fetchReadmissionIntelligence(filters);
}

export async function getLengthOfStayAnalytics(filters: QualityFilterState = {}) {
  return fetchLengthOfStayAnalytics(filters);
}

export async function getMedicationQuality(filters: QualityFilterState = {}) {
  return fetchMedicationQuality(filters);
}

export async function getEmergencyInpatientAnalytics(filters: QualityFilterState = {}) {
  return fetchEmergencyInpatientAnalytics(filters);
}

export async function getClinicalRisk(filters: QualityFilterState = {}) {
  return fetchClinicalRisk(filters);
}

export async function getQualityInsights(filters: QualityFilterState = {}) {
  return generateQualityInsights(filters);
}

export async function getQualityTrends(filters: QualityFilterState = {}) {
  return fetchQualityTrends(filters);
}

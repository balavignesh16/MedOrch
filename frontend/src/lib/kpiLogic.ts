import { cache } from 'react';
import {
  QueryFactory,
  normalizeFilters,
  calculateReadmissionRate,
  buildWhereClause,
  FilterState,
  KpiStatus,
  SummaryInsight
} from './analytics';

export type { FilterState, SummaryInsight };

// --------------------------------------------------------------------------
// Cached Data Fetchers (Performance Enhancement 6)
// --------------------------------------------------------------------------

export const fetchRawKpiMetrics = cache(async (filters: FilterState = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);

  const coreMetrics = QueryFactory.executeCoreMetrics('hospital_readmissions', normFilters);

  const readmissionRow = QueryFactory.executeCustomQuery<{ readmitted: string, count: number }[]>(
    `SELECT readmitted, COUNT(*) as count FROM hospital_readmissions ${whereClause} GROUP BY readmitted`,
    params,
    []
  );

  const ageDistribution = QueryFactory.executeCustomQuery<{ age_group: string, patient_count: number }[]>(
    `SELECT age as age_group, COUNT(*) as patient_count FROM hospital_readmissions ${whereClause} GROUP BY age ORDER BY age`,
    params,
    []
  );

  const medsByReadmission = QueryFactory.executeCustomQuery<{ status: string, avg_meds: number }[]>(
    `SELECT readmitted as status, AVG(num_medications) as avg_meds FROM hospital_readmissions ${whereClause} GROUP BY readmitted`,
    params,
    []
  );

  return {
    totalEncounters: coreMetrics.totalEncounters,
    avgTimeInHospital: coreMetrics.avgLengthOfStay,
    readmissionProxyRate: coreMetrics.readmissionProxyRate,
    readmissionBreakdown: readmissionRow,
    ageDistribution,
    medsByReadmission
  };
});

// --------------------------------------------------------------------------
// Business Logic (Code Quality Enhancement 8)
// --------------------------------------------------------------------------

export { calculateReadmissionRate }; // Re-export for compatibility

export function getReadmissionStatus(rate: number): KpiStatus {
  if (rate < 10) return 'Excellent';
  if (rate < 15) return 'Good';
  if (rate < 25) return 'Watch';
  return 'Critical';
}

export function getHospitalHealthStatus(score: number): KpiStatus {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Watch';
  return 'Critical';
}

// --------------------------------------------------------------------------
// Executive Summary Engine
// --------------------------------------------------------------------------

export function generateExecutiveSummary(metrics: { total: number, healthScore: number, readmissionRate: number, avgStay: number }): SummaryInsight[] {
  const insights: SummaryInsight[] = [];

  if (metrics.total === 0) {
    return [{ type: 'Info', text: 'No encounters found for the current filter criteria.' }];
  }

  // 1. Health Score Insight
  if (metrics.healthScore >= 85) {
    insights.push({ type: 'Positive', text: `Hospital Health is Excellent (${metrics.healthScore}), indicating strong operational stability.` });
  } else if (metrics.healthScore >= 60) {
    insights.push({ type: 'Warning', text: `Hospital Health is Watchful (${metrics.healthScore}). Resource constraints detected.` });
  } else {
    insights.push({ type: 'Critical', text: `Hospital Health is Critical (${metrics.healthScore}). Immediate executive review required.` });
  }

  // 2. Readmission Insight
  if (metrics.readmissionRate < 10) {
    insights.push({ type: 'Positive', text: `Readmissions are well below target at ${metrics.readmissionRate.toFixed(1)}%.` });
  } else if (metrics.readmissionRate > 20) {
    insights.push({ type: 'Critical', text: `Readmissions spiked to ${metrics.readmissionRate.toFixed(1)}%, exceeding the 15% threshold.` });
  } else {
    insights.push({ type: 'Info', text: `Readmission rates are stable at ${metrics.readmissionRate.toFixed(1)}%.` });
  }

  // 3. Length of Stay Insight
  if (metrics.avgStay > 6) {
    insights.push({ type: 'Warning', text: `Average length of stay is high (${metrics.avgStay.toFixed(1)} days), impacting bed turnover.` });
  } else {
    insights.push({ type: 'Positive', text: `Average length of stay (${metrics.avgStay.toFixed(1)} days) is highly efficient.` });
  }

  return insights.slice(0, 3);
}

import { cache } from 'react';
import {
  QueryFactory,
  normalizeFilters,
  calculateClinicalQualityScore,
  generateQualityInsights as coreGenerateQualityInsights,
  extractAggregates,
  buildWhereClause,
  AnalyticsFilterState
  , ENCOUNTER_RISK_CASE_SQL
  , HIGH_RISK_ENCOUNTER_SQL
} from './analytics';

export type QualityFilterState = AnalyticsFilterState;

interface QualityTrendRow {
  category: string;
  count: number;
  avg_los: number;
  readmissions: number;
  er_visits: number;
  avg_meds: number;
}

interface LengthOfStayStatsRow {
  avg_los: number | null;
  max_los: number | null;
  min_los: number | null;
}

interface VisitTotalsRow {
  er: number | null;
  inpatient: number | null;
  outpatient: number | null;
}

// --- API Methods ---

export const fetchQualityOverview = cache(async (filters: AnalyticsFilterState = {}) => {
  const normFilters = normalizeFilters(filters);
  const coreMetrics = QueryFactory.executeCoreMetrics('hospital_readmissions', normFilters);
  const totalPatients = coreMetrics.totalEncounters;

  if (totalPatients === 0) {
    return {
      score: 0,
      scoreBreakdown: { readmission: 0, los: 0, meds: 0, er: 0, highRisk: 0 },
      readmissionRate: 0,
      avgLos: null,
      highRiskPercent: 0,
      erVisits: 0,
      avgProcedures: 0,
      avgMeds: 0,
      improvementScore: 0,
      totalPatients: 0
    };
  }

  const agg = QueryFactory.executeAggregation('hospital_readmissions', normFilters);
  const { avgMedications, avgEmergencyVisits, avgProcedures } = extractAggregates(agg);
  const avgLengthOfStay = coreMetrics.avgLengthOfStay;
  
  const highRiskCount = QueryFactory.executeCount('hospital_readmissions', normFilters, HIGH_RISK_ENCOUNTER_SQL);

  const readmissionRate = coreMetrics.readmissionProxyRate;
  const highRiskPercent = (highRiskCount / totalPatients) * 100;

  const scoreResult = calculateClinicalQualityScore({
    readmissionRate,
    avgLos: avgLengthOfStay ?? 0,
    avgMeds: avgMedications,
    erVisits: avgEmergencyVisits,
    highRiskPercent
  });

  return {
    score: scoreResult.value,
    scoreBreakdown: scoreResult.breakdown,
    readmissionRate,
    avgLos: avgLengthOfStay,
    highRiskPercent,
    erVisits: avgEmergencyVisits,
    avgProcedures,
    avgMeds: avgMedications,
    improvementScore: 12,
    totalPatients
  };
});

export const fetchReadmissionIntelligence = cache(async (filters: AnalyticsFilterState = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);
  
  const distribution = QueryFactory.executeCustomQuery<{ bucket: string, count: number }[]>(`
    SELECT 
      CASE 
        WHEN readmitted = '<30' THEN '< 30 Days'
        WHEN readmitted = '>30' THEN '> 30 Days'
        ELSE 'Not Readmitted'
      END as bucket,
      COUNT(*) as count 
    FROM hospital_readmissions 
    ${whereClause} 
    GROUP BY bucket
  `, params, []);

  const byAge = QueryFactory.executeCustomQuery<{ category: string, count: number, readmitted: number }[]>(`
    SELECT 
      age as category, 
      COUNT(*) as count,
      SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END) as readmitted
    FROM hospital_readmissions 
    ${whereClause} 
    GROUP BY age
  `, params, []);

  const byGender = QueryFactory.executeCustomQuery<{ category: string, count: number, readmitted: number }[]>(`
    SELECT 
      gender as category, 
      COUNT(*) as count,
      SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END) as readmitted
    FROM hospital_readmissions 
    ${whereClause} 
    GROUP BY gender
  `, params, []);

  const byRace = QueryFactory.executeCustomQuery<{ category: string, count: number, readmitted: number }[]>(`
    SELECT 
      race as category, 
      COUNT(*) as count,
      SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END) as readmitted
    FROM hospital_readmissions 
    ${whereClause} 
    GROUP BY race
  `, params, []);

  const byDiagnosis = QueryFactory.executeCustomQuery<{ category: string, count: number, readmitted: number }[]>(`
    SELECT 
      diag_1 as category, 
      COUNT(*) as count,
      SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END) as readmitted
    FROM hospital_readmissions 
    ${whereClause} 
    GROUP BY diag_1
    ORDER BY count DESC
    LIMIT 10
  `, params, []);

  const byAdmissionType = QueryFactory.executeCustomQuery<{ category: string, count: number, readmitted: number }[]>(`
    SELECT 
      admission_type_id as category, 
      COUNT(*) as count,
      SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END) as readmitted
    FROM hospital_readmissions 
    ${whereClause} 
    GROUP BY admission_type_id
  `, params, []);

  const byDischargeDisposition = QueryFactory.executeCustomQuery<{ category: string, count: number, readmitted: number }[]>(`
    SELECT 
      discharge_disposition_id as category, 
      COUNT(*) as count,
      SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END) as readmitted
    FROM hospital_readmissions 
    ${whereClause} 
    GROUP BY discharge_disposition_id
  `, params, []);

  return {
    distribution,
    byAge,
    byGender,
    byRace,
    byDiagnosis,
    byAdmissionType,
    byDischargeDisposition
  };
});

export const fetchQualityTrends = cache(async (filters: AnalyticsFilterState = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);
  
  const rawTrends = QueryFactory.executeCustomQuery<QualityTrendRow[]>(`
    SELECT 
      age as category,
      COUNT(*) as count,
      AVG(time_in_hospital) as avg_los,
      SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END) as readmissions,
      SUM(CASE WHEN number_emergency > 0 THEN 1 ELSE 0 END) as er_visits,
      AVG(num_medications) as avg_meds
    FROM hospital_readmissions
    ${whereClause}
    GROUP BY age
    ORDER BY age
  `, params, []);
  
  return rawTrends.map(t => ({
    period: t.category || 'Unknown',
    readmissions: (t.readmissions / t.count) * 100,
    los: t.avg_los,
    meds: t.avg_meds,
    erVisits: t.er_visits
  }));
});

export const generateQualityInsights = cache(async (filters: AnalyticsFilterState = {}) => {
  const overview = await fetchQualityOverview(filters);
  const normFilters = normalizeFilters(filters);
  const highRiskCount = QueryFactory.executeCount('hospital_readmissions', normFilters, HIGH_RISK_ENCOUNTER_SQL);
  
  return coreGenerateQualityInsights(overview.readmissionRate, highRiskCount, "All Patients");
});

export const fetchLengthOfStayAnalytics = cache(async (filters: AnalyticsFilterState = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);

  const statsQuery = `SELECT AVG(time_in_hospital) as avg_los, MAX(time_in_hospital) as max_los, MIN(time_in_hospital) as min_los FROM hospital_readmissions ${whereClause}`;
  const statsRaw = QueryFactory.executeCustomQuery<LengthOfStayStatsRow[]>(statsQuery, params, [{ avg_los: 0, max_los: 0, min_los: 0 }]);
  const stats = {
    avg_los: statsRaw[0]?.avg_los || 0,
    max_los: statsRaw[0]?.max_los || 0,
    min_los: statsRaw[0]?.min_los || 0,
    median_los: statsRaw[0]?.avg_los || 0 // Approximated
  };

  const distribution = QueryFactory.executeCustomQuery<{ los: number, count: number }[]>(`
    SELECT time_in_hospital as los, COUNT(*) as count FROM hospital_readmissions ${whereClause} GROUP BY time_in_hospital ORDER BY time_in_hospital
  `, params, []);

  const cohorts = QueryFactory.executeCustomQuery<{ diag_1: string, avg_los: number, count: number }[]>(`
    SELECT diag_1, AVG(time_in_hospital) as avg_los, COUNT(*) as count FROM hospital_readmissions ${whereClause} GROUP BY diag_1 HAVING count > 10 ORDER BY avg_los DESC
  `, params, []);

  const topCohorts = cohorts.slice(0, 5);
  const lowestCohorts = cohorts.slice().reverse().slice(0, 5);

  const outliersCount = QueryFactory.executeCustomQuery<{ count: number }[]>(`
    SELECT COUNT(*) as count FROM hospital_readmissions ${whereClause ? whereClause + ' AND' : 'WHERE'} time_in_hospital > 10
  `, params, [{ count: 0 }])[0].count;

  return { stats, distribution, topCohorts, lowestCohorts, outliersCount };
});

export const fetchClinicalRisk = cache(async (filters: AnalyticsFilterState = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);
  
  const total = QueryFactory.executeCount('hospital_readmissions', normFilters);

  const query = `
    SELECT 
      ${ENCOUNTER_RISK_CASE_SQL} as risk_category,
      COUNT(*) as count
    FROM hospital_readmissions
    ${whereClause}
    GROUP BY risk_category
  `;
  const rawDist = QueryFactory.executeCustomQuery<{ risk_category: string, count: number }[]>(query, params, []);
  
  const distribution = {
    Low: { count: 0, drivers: ['Standard stay'] },
    Medium: { count: 0, drivers: ['Polypharmacy (>10)', 'LOS > 3'] },
    High: { count: 0, drivers: ['Prior ER Visits', 'LOS > 5'] },
    Critical: { count: 0, drivers: ['Extreme Polypharmacy', 'Frequent ER', 'LOS > 7'] }
  };
  
  rawDist.forEach(d => {
    if (d.risk_category in distribution) {
      distribution[d.risk_category as keyof typeof distribution].count = d.count;
    }
  });

  return { total, distribution };
});

export const fetchMedicationQuality = cache(async (filters: AnalyticsFilterState = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);

  const total = QueryFactory.executeCount('hospital_readmissions', normFilters);
  const polypharmacyCount = QueryFactory.executeCount('hospital_readmissions', normFilters, 'num_medications >= 10');
  
  const avgMedsRow = QueryFactory.executeCustomQuery<{ avg_meds: number }[]>(`SELECT AVG(num_medications) as avg_meds FROM hospital_readmissions ${whereClause}`, params, [{ avg_meds: 0 }]);
  const avgMeds = avgMedsRow[0]?.avg_meds || 0;

  const byAge = QueryFactory.executeCustomQuery<{ age: string, avg_meds: number }[]>(`
    SELECT age, AVG(num_medications) as avg_meds FROM hospital_readmissions ${whereClause} GROUP BY age
  `, params, []);

  const byDiagnosis = QueryFactory.executeCustomQuery<{ diag_1: string, avg_meds: number, count: number }[]>(`
    SELECT diag_1, AVG(num_medications) as avg_meds, COUNT(*) as count FROM hospital_readmissions ${whereClause} GROUP BY diag_1 ORDER BY count DESC LIMIT 10
  `, params, []);

  return {
    avgMeds,
    polypharmacyPercent: total > 0 ? (polypharmacyCount / total) * 100 : 0,
    byAge,
    byDiagnosis
  };
});

export const fetchEmergencyInpatientAnalytics = cache(async (filters: AnalyticsFilterState = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);

  const totalsRow = QueryFactory.executeCustomQuery<VisitTotalsRow[]>(`
    SELECT 
      SUM(number_emergency) as er, 
      SUM(number_inpatient) as inpatient, 
      SUM(number_outpatient) as outpatient 
    FROM hospital_readmissions ${whereClause}
  `, params, [{ er: 0, inpatient: 0, outpatient: 0 }]);

  const totals = {
    er: totalsRow[0]?.er || 0,
    inpatient: totalsRow[0]?.inpatient || 0,
    outpatient: totalsRow[0]?.outpatient || 0
  };

  const visitFrequency = QueryFactory.executeCustomQuery<{ total_visits: number, count: number }[]>(`
    SELECT (number_emergency + number_inpatient + number_outpatient) as total_visits, COUNT(*) as count 
    FROM hospital_readmissions ${whereClause} 
    GROUP BY total_visits 
    ORDER BY total_visits LIMIT 10
  `, params, []);

  return { totals, visitFrequency };
});

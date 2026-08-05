import { cache } from 'react';
import {
  QueryFactory,
  normalizeFilters,
  AnalyticsFilterState,
  buildWhereClause,
  buildCostSqlExpression,
  calculateFinancialScore,
  generateFinancialInsights as coreGenerateFinancialInsights
} from './analytics';

export type FinancialFilterState = AnalyticsFilterState;

// --- API Methods ---

export const fetchFinancialOverview = cache(async (filters: any = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);

  const totalPatients = QueryFactory.executeCount('hospital_readmissions', normFilters);
  
  if (totalPatients === 0) {
    return {
      score: 0,
      scoreBreakdown: { costEfficiency: 0, readmission: 0, highRisk: 0, erUtilization: 0 },
      totalCost: 0,
      avgCost: 0,
      readmissionCost: 0,
      medicationCost: 0,
      laboratoryCost: 0,
      procedureCost: 0,
      emergencyCost: 0,
      costIndex: 0,
      resourceEfficiency: 0,
      highRiskCount: 0
    };
  }

  const costExpr = buildCostSqlExpression();
  const query = `
    SELECT 
      SUM(${costExpr}) as total_cost,
      AVG(${costExpr}) as avg_cost,
      SUM(CASE WHEN readmitted = '<30' THEN 50 ELSE 0 END) as readmission_cost,
      SUM(num_medications * 3) as med_cost,
      SUM(num_lab_procedures * 5) as lab_cost,
      SUM(num_procedures * 20) as proc_cost,
      SUM(number_emergency * 30) as er_cost,
      SUM(CASE WHEN (readmitted = '<30' OR time_in_hospital >= 8 OR num_medications >= 20) THEN ${costExpr} ELSE 0 END) as high_risk_cost
    FROM hospital_readmissions
    ${whereClause}
  `;
  
  const res = QueryFactory.executeCustomQuery<any[]>(query, params, [
    { total_cost: 0, avg_cost: 0, readmission_cost: 0, med_cost: 0, lab_cost: 0, proc_cost: 0, er_cost: 0, high_risk_cost: 0 }
  ])[0];

  const totalCost = res?.total_cost || 0;
  const avgCost = res?.avg_cost || 0;
  const highRiskCount = QueryFactory.executeCount('hospital_readmissions', normFilters, `(readmitted = '<30' OR time_in_hospital >= 8 OR num_medications >= 20)`);

  const scoreResult = calculateFinancialScore({
    avgCost,
    readmissionCostPercent: totalCost > 0 ? (res.readmission_cost / totalCost) * 100 : 0,
    highRiskCostPercent: totalCost > 0 ? (res.high_risk_cost / totalCost) * 100 : 0,
    erCostPercent: totalCost > 0 ? (res.er_cost / totalCost) * 100 : 0
  });

  return {
    score: scoreResult.value,
    scoreBreakdown: scoreResult.breakdown,
    totalCost,
    avgCost,
    readmissionCost: res?.readmission_cost || 0,
    medicationCost: res?.med_cost || 0,
    laboratoryCost: res?.lab_cost || 0,
    procedureCost: res?.proc_cost || 0,
    emergencyCost: res?.er_cost || 0,
    costIndex: Math.round(avgCost / 10), // Example normalization
    resourceEfficiency: scoreResult.breakdown.costEfficiency,
    highRiskCount,
    totalPatients
  };
});

export const fetchCostIntelligence = cache(async (filters: any = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);
  const costExpr = buildCostSqlExpression();

  const byAge = QueryFactory.executeCustomQuery<{ category: string, total_cost: number, avg_cost: number, count: number }[]>(`
    SELECT age as category, SUM(${costExpr}) as total_cost, AVG(${costExpr}) as avg_cost, COUNT(*) as count
    FROM hospital_readmissions ${whereClause} GROUP BY age ORDER BY age
  `, params, []);

  const byGender = QueryFactory.executeCustomQuery<{ category: string, total_cost: number, avg_cost: number, count: number }[]>(`
    SELECT gender as category, SUM(${costExpr}) as total_cost, AVG(${costExpr}) as avg_cost, COUNT(*) as count
    FROM hospital_readmissions ${whereClause} GROUP BY gender
  `, params, []);

  const byDiagnosis = QueryFactory.executeCustomQuery<{ category: string, total_cost: number, avg_cost: number, count: number }[]>(`
    SELECT diag_1 as category, SUM(${costExpr}) as total_cost, AVG(${costExpr}) as avg_cost, COUNT(*) as count
    FROM hospital_readmissions ${whereClause} GROUP BY diag_1 ORDER BY total_cost DESC LIMIT 10
  `, params, []);

  const byRisk = QueryFactory.executeCustomQuery<{ category: string, total_cost: number, avg_cost: number, count: number }[]>(`
    SELECT 
      CASE 
        WHEN (time_in_hospital > 7 OR number_emergency > 2 OR num_medications > 20) THEN 'Critical'
        WHEN (time_in_hospital > 5 OR number_emergency > 0 OR num_medications > 15) THEN 'High'
        WHEN (time_in_hospital > 3 OR num_medications > 10) THEN 'Medium'
        ELSE 'Low'
      END as category,
      SUM(${costExpr}) as total_cost, AVG(${costExpr}) as avg_cost, COUNT(*) as count
    FROM hospital_readmissions ${whereClause} GROUP BY category
  `, params, []);

  return { byAge, byGender, byDiagnosis, byRisk };
});

export const fetchResourceUtilization = cache(async (filters: any = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);

  const raw = QueryFactory.executeCustomQuery<any[]>(`
    SELECT 
      SUM(num_medications) as meds,
      SUM(num_lab_procedures) as labs,
      SUM(num_procedures) as procs,
      SUM(number_emergency) as er,
      SUM(number_inpatient) as inp,
      SUM(number_outpatient) as outp
    FROM hospital_readmissions ${whereClause}
  `, params, [
    { meds: 0, labs: 0, procs: 0, er: 0, inp: 0, outp: 0 }
  ])[0];

  return {
    medications: raw?.meds || 0,
    laboratories: raw?.labs || 0,
    procedures: raw?.procs || 0,
    emergency: raw?.er || 0,
    inpatient: raw?.inp || 0,
    outpatient: raw?.outp || 0
  };
});

export const fetchHighCostCohorts = cache(async (filters: any = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);
  const costExpr = buildCostSqlExpression();

  const cohorts = QueryFactory.executeCustomQuery<{ diag_1: string, count: number, total_cost: number, avg_cost: number, avg_los: number, readmission_rate: number, avg_meds: number }[]>(`
    SELECT 
      diag_1,
      COUNT(*) as count,
      SUM(${costExpr}) as total_cost,
      AVG(${costExpr}) as avg_cost,
      AVG(time_in_hospital) as avg_los,
      (SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as readmission_rate,
      AVG(num_medications) as avg_meds
    FROM hospital_readmissions ${whereClause} 
    GROUP BY diag_1 
    HAVING count > 10
    ORDER BY total_cost DESC 
    LIMIT 15
  `, params, []);

  return cohorts;
});

export const fetchFinancialTrends = cache(async (filters: any = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);
  const costExpr = buildCostSqlExpression();
  
  const rawTrends = QueryFactory.executeCustomQuery<any[]>(`
    SELECT 
      (encounter_id % 12) + 1 as month_index,
      COUNT(*) as count,
      AVG(${costExpr}) as avg_cost,
      SUM(${costExpr}) as total_cost,
      SUM(num_medications * 3) as med_cost,
      SUM(CASE WHEN readmitted = '<30' THEN 50 ELSE 0 END) as readmission_cost
    FROM hospital_readmissions
    ${whereClause}
    GROUP BY month_index
    ORDER BY month_index
  `, params, []);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return rawTrends.map(t => ({
    period: monthNames[t.month_index - 1],
    avgCost: t.avg_cost,
    totalCost: t.total_cost,
    medCost: t.med_cost,
    readmissionCost: t.readmission_cost
  }));
});

export const generateFinancialInsights = cache(async (filters: any = {}) => {
  const overview = await fetchFinancialOverview(filters);
  return coreGenerateFinancialInsights({
    totalCost: overview.totalCost,
    avgCost: overview.avgCost,
    readmissionCost: overview.readmissionCost,
    erCost: overview.emergencyCost,
    polypharmacyCost: overview.medicationCost,
    highRiskCount: overview.highRiskCount
  });
});

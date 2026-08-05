import { cache } from 'react';
import {
  QueryFactory,
  normalizeFilters,
  AnalyticsFilterState,
  buildWhereClause,
  calculateOperationalScore,
  generateOperationalInsights as coreGenerateOperationalInsights
} from './analytics';

export type OperationalFilterState = AnalyticsFilterState;

export const fetchOperationalOverview = cache(async (filters: any = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);

  const totalPatients = QueryFactory.executeCount('hospital_readmissions', normFilters);

  if (totalPatients === 0) {
    return {
      score: 0,
      scoreBreakdown: {},
      throughput: 0,
      bedOccupancy: 0,
      erLoad: 0,
      inpatientLoad: 0,
      outpatientLoad: 0,
      avgLos: 0,
      resourceEfficiency: 0,
      workflowEfficiency: 0
    };
  }

  const query = `
    SELECT 
      AVG(time_in_hospital) as avg_los,
      SUM(number_emergency) as total_er,
      SUM(number_inpatient) as total_inp,
      SUM(number_outpatient) as total_outp,
      SUM(num_medications) as total_meds,
      SUM(num_lab_procedures) as total_labs,
      SUM(num_procedures) as total_procs
    FROM hospital_readmissions
    ${whereClause}
  `;

  const res = QueryFactory.executeCustomQuery<any[]>(query, params, [
    { avg_los: 0, total_er: 0, total_inp: 0, total_outp: 0, total_meds: 0, total_labs: 0, total_procs: 0 }
  ])[0];

  // Synthetic aggregations for demo purposes to simulate operational metrics
  const throughput = Math.round(totalPatients / 30); // Monthly avg daily throughput
  const bedOccupancy = Math.min(100, Math.round(70 + (res?.avg_los || 0) * 2));
  const erLoad = totalPatients > 0 ? ((res?.total_er || 0) / totalPatients) * 100 : 0;
  const inpatientLoad = totalPatients > 0 ? ((res?.total_inp || 0) / totalPatients) * 100 : 0;
  const outpatientLoad = totalPatients > 0 ? ((res?.total_outp || 0) / totalPatients) * 100 : 0;
  const resourceEfficiency = 85; // Synthetic
  const workflowEfficiency = 88; // Synthetic

  const scoreResult = calculateOperationalScore({
    throughput,
    bedUtilization: bedOccupancy,
    erLoad,
    inpatientLoad,
    outpatientLoad,
    avgLos: res?.avg_los || 0,
    resourceEfficiency,
    workflowEfficiency
  });

  return {
    score: scoreResult.value,
    scoreBreakdown: scoreResult.breakdown,
    throughput,
    bedOccupancy,
    erLoad,
    inpatientLoad,
    outpatientLoad,
    avgLos: res?.avg_los || 0,
    resourceEfficiency,
    workflowEfficiency,
    totalPatients
  };
});

export const fetchPatientFlow = cache(async (filters: any = {}) => {
  // Synthetic flow data matching request
  const total = QueryFactory.executeCount('hospital_readmissions', normalizeFilters(filters));
  if (total === 0) return [];

  return [
    { stage: 'Admission', count: total, avgTime: '45m', queue: Math.round(total * 0.05), dropoff: 2, capacity: 85, bottleneck: false },
    { stage: 'Emergency', count: Math.round(total * 0.4), avgTime: '2.5h', queue: Math.round(total * 0.08), dropoff: 18, capacity: 95, bottleneck: true },
    { stage: 'Ward', count: Math.round(total * 0.55), avgTime: '4.2d', queue: Math.round(total * 0.02), dropoff: 0, capacity: 88, bottleneck: false },
    { stage: 'Procedure', count: Math.round(total * 0.3), avgTime: '1.5h', queue: Math.round(total * 0.04), dropoff: 5, capacity: 62, bottleneck: false },
    { stage: 'Discharge', count: Math.round(total * 0.95), avgTime: '3.1h', queue: Math.round(total * 0.06), dropoff: 0, capacity: 75, bottleneck: true }
  ];
});

export const fetchOperationalResources = cache(async (filters: any = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);

  const query = `
    SELECT 
      SUM(num_medications) as meds,
      SUM(num_lab_procedures) as labs,
      SUM(num_procedures) as procs,
      SUM(number_emergency) as er,
      SUM(number_inpatient) as inp,
      SUM(number_outpatient) as outp
    FROM hospital_readmissions
    ${whereClause}
  `;
  const raw = QueryFactory.executeCustomQuery<any[]>(query, params, [{ meds: 0, labs: 0, procs: 0, er: 0, inp: 0, outp: 0 }])[0];
  const total = (raw?.meds || 0) + (raw?.labs || 0) + (raw?.procs || 0) + (raw?.er || 0) + (raw?.inp || 0) + (raw?.outp || 0);

  return [
    { name: 'Beds', utilization: 88, capacity: 92, contribution: 40, trend: '+2.1%', benchmark: 85, variance: '+3.0' },
    { name: 'Laboratories', utilization: 75, capacity: 85, contribution: total > 0 ? ((raw?.labs || 0) / total * 100) : 0, trend: '-1.5%', benchmark: 80, variance: '-5.0' },
    { name: 'Procedures', utilization: 62, capacity: 100, contribution: total > 0 ? ((raw?.procs || 0) / total * 100) : 0, trend: '+0.5%', benchmark: 75, variance: '-13.0' },
    { name: 'Emergency', utilization: 95, capacity: 100, contribution: total > 0 ? ((raw?.er || 0) / total * 100) : 0, trend: '+5.2%', benchmark: 80, variance: '+15.0' },
    { name: 'Inpatient', utilization: 85, capacity: 90, contribution: total > 0 ? ((raw?.inp || 0) / total * 100) : 0, trend: '+1.1%', benchmark: 82, variance: '+3.0' },
    { name: 'Outpatient', utilization: 70, capacity: 80, contribution: total > 0 ? ((raw?.outp || 0) / total * 100) : 0, trend: '-2.0%', benchmark: 75, variance: '-5.0' },
    { name: 'Medication', utilization: 92, capacity: 95, contribution: total > 0 ? ((raw?.meds || 0) / total * 100) : 0, trend: '+3.4%', benchmark: 90, variance: '+2.0' }
  ];
});

export const fetchCapacityMetrics = cache(async (filters: any = {}) => {
  return {
    current: 450,
    available: 50,
    estimated: 520,
    capacityPercent: 90,
    critical: ['Cardiology ICU', 'Emergency'],
    warning: ['Med-Surg East', 'Neurology'],
    safe: ['Orthopedics', 'Pediatrics'],
    trend: '+4%',
    variance: '+12 beds'
  };
});

export const fetchBottlenecks = cache(async (filters: any = {}) => {
  return [
    {
      title: 'ER Wait Time to Admit',
      severity: 'Critical',
      confidence: 94,
      supportingMetric: '2.5h Avg Wait',
      rootCause: 'Lack of telemetry beds',
      operationalImpact: 'LWBS (Left Without Being Seen) increased by 18%',
      estimatedDelay: '1.5 hours above target',
      recommendedAction: 'Expedite MS/Tele discharges',
      relatedDashboard: 'Patient Flow',
      drilldown: '/population?admission_type_id=1'
    },
    {
      title: 'Discharge Processing',
      severity: 'Warning',
      confidence: 89,
      supportingMetric: '3.1h Avg Processing',
      rootCause: 'Delayed SNF placement approval',
      operationalImpact: 'Blocks 12 beds daily from ED admissions',
      estimatedDelay: '2 hours above target',
      recommendedAction: 'Engage secondary SNF network',
      relatedDashboard: 'Capacity Dashboard',
      drilldown: '/population'
    }
  ];
});

export const fetchOperationalTrends = cache(async (filters: any = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);

  const query = `
    SELECT 
      (encounter_id % 12) + 1 as month_index,
      COUNT(*) as count,
      AVG(time_in_hospital) as avg_los,
      SUM(number_emergency) as total_er
    FROM hospital_readmissions
    ${whereClause}
    GROUP BY (encounter_id % 12) + 1
    ORDER BY month_index ASC
  `;
  
  const rawTrends = QueryFactory.executeCustomQuery<any[]>(query, params);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return rawTrends.map(t => ({
    period: monthNames[t.month_index - 1],
    throughput: Math.round(t.count / 30),
    los: t.avg_los,
    erVisits: t.total_er
  }));
});

export const fetchOperationalInsights = cache(async (filters: any = {}) => {
  return coreGenerateOperationalInsights(filters);
});

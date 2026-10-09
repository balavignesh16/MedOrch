"use server";

import { 
  fetchRawKpiMetrics, 
  getReadmissionStatus, 
  getHospitalHealthStatus,
  FilterState
} from '@/lib/kpiLogic';

export async function getKpiMetrics(filters?: FilterState) {
  const raw = await fetchRawKpiMetrics(filters);
  const readmissionRate = raw.readmissionProxyRate;

  return {
    totalEncounters: raw.totalEncounters,
    avgTimeInHospital: raw.avgTimeInHospital === null ? "N/A" : raw.avgTimeInHospital.toFixed(1),
    readmissionRate: readmissionRate.toFixed(1),
    readmissionStatus: getReadmissionStatus(readmissionRate),
    readmissionBreakdown: raw.readmissionBreakdown,
    ageDistribution: raw.ageDistribution,
    medsByReadmission: raw.medsByReadmission
  };
}

export async function getHospitalHealthScore(filters?: FilterState) {
  const raw = await fetchRawKpiMetrics(filters);
  const rate = raw.readmissionProxyRate;
  
  let score = 100 - rate;
  score = Math.max(40, Math.min(98, score + 30));
  
  return {
    score: raw.totalEncounters === 0 ? "--" : score.toFixed(0),
    trend: '+2.4%',
    status: raw.totalEncounters === 0 ? 'Watch' : getHospitalHealthStatus(score)
  };
}

"use server";

import { cache } from 'react';
import { 
  fetchRawKpiMetrics, 
  calculateReadmissionRate, 
  getReadmissionStatus, 
  getHospitalHealthStatus,
  FilterState
} from '@/lib/kpiLogic';

export async function getKpiMetrics(filters?: FilterState) {
  const raw = await fetchRawKpiMetrics(filters);
  
  const readmissionRate = calculateReadmissionRate(raw.totalEncounters, raw.readmissionBreakdown);

  return {
    totalEncounters: raw.totalEncounters,
    avgTimeInHospital: raw.avgTimeInHospital ? raw.avgTimeInHospital.toFixed(1) : "0.0",
    readmissionRate: readmissionRate.toFixed(1),
    readmissionStatus: getReadmissionStatus(readmissionRate),
    readmissionBreakdown: raw.readmissionBreakdown,
    ageDistribution: raw.ageDistribution,
    medsByReadmission: raw.medsByReadmission
  };
}

export async function getHospitalHealthScore(filters?: FilterState) {
  const raw = await fetchRawKpiMetrics(filters);
  const rate = calculateReadmissionRate(raw.totalEncounters, raw.readmissionBreakdown);
  
  let score = 100 - rate;
  score = Math.max(40, Math.min(98, score + 30));
  
  return {
    score: raw.totalEncounters === 0 ? "--" : score.toFixed(0),
    trend: '+2.4%',
    status: raw.totalEncounters === 0 ? 'Watch' : getHospitalHealthStatus(score)
  };
}

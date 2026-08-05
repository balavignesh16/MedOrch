import { cache } from 'react';
import { QueryFactory, normalizeFilters, AnalyticsFilterState, buildWhereClause, generatePredictiveInsights as coreGeneratePredictiveInsights } from './analytics';
import { mlService } from './ml/mlService';

export type PredictiveFilterState = AnalyticsFilterState;

export const fetchPredictionOverview = cache(async (filters: PredictiveFilterState) => {
  const normalized = normalizeFilters(filters);
  // Simulate a DB call that would fetch raw data to run through ML
  const hospitalFeatures = { winterSeason: true, recentVolumeSpike: false };
  
  const demandPrediction = await mlService.predictDemandForecast(hospitalFeatures);
  
  return {
    healthScore: 82,
    expectedReadmissions: 1420,
    predictedAvgLos: 4.8,
    demandScore: demandPrediction.output.demandScore,
    explainability: demandPrediction.explainability
  };
});

export const fetchHighRiskPatients = cache(async (filters: PredictiveFilterState) => {
  const normalized = normalizeFilters(filters);
  
  // Generate dummy high risk cohort
  const patients = [
    { id: 'PT-9012', age: 72, diagnoses: 4, recentErVisits: 2, medications: 8 },
    { id: 'PT-1044', age: 85, diagnoses: 6, recentErVisits: 1, medications: 12 },
    { id: 'PT-3321', age: 64, diagnoses: 3, recentErVisits: 0, medications: 4 }
  ];

  const scoredPatients = await Promise.all(patients.map(async p => {
    const readmission = await mlService.predictReadmission(p);
    const los = await mlService.predictLengthOfStay(p);
    const risk = await mlService.predictPatientRisk(p);
    return {
      patientId: p.id,
      readmissionRisk: readmission.output.probability,
      predictedLos: los.output.days,
      overallRisk: risk.output.score,
      explainability: readmission.explainability,
      audit: readmission.audit
    };
  }));

  return scoredPatients.sort((a, b) => b.overallRisk - a.overallRisk);
});

export const fetchPredictionDistribution = cache(async (filters: PredictiveFilterState) => {
  return [
    { level: 'Critical Risk', count: 420 },
    { level: 'High Risk', count: 1250 },
    { level: 'Medium Risk', count: 3400 },
    { level: 'Low Risk', count: 18000 }
  ];
});

export const fetchDemandForecast = cache(async (filters: PredictiveFilterState) => {
  return [
    { date: '2026-08-01', bedDemand: 450, erVolume: 120 },
    { date: '2026-08-02', bedDemand: 460, erVolume: 135 },
    { date: '2026-08-03', bedDemand: 475, erVolume: 150 },
    { date: '2026-08-04', bedDemand: 490, erVolume: 165 },
    { date: '2026-08-05', bedDemand: 510, erVolume: 180 }
  ];
});

export const fetchInterventions = cache(async (filters: PredictiveFilterState) => {
  return [
    { id: 1, priority: 'Critical', action: 'Downgrade 5 ICU patients to Telemetry', impact: '$45k savings', team: 'Capacity Management', timeline: 'Immediate' },
    { id: 2, priority: 'High', action: 'Enroll 42 Heart Failure patients in Remote Monitoring', impact: 'Reduce readmissions by 12%', team: 'Care Coordination', timeline: 'Within 48h' },
    { id: 3, priority: 'Medium', action: 'Schedule PT consults for 18 Ortho patients', impact: '-1.5 Days LOS', team: 'Physical Therapy', timeline: 'By tomorrow' }
  ];
});

export const fetchMonitoringSummary = cache(async () => {
  const { modelMonitor } = await import('./ml/modelMonitoring');
  return modelMonitor.getMonitoringSummary('readmission_v1');
});

export const generatePredictiveInsights = cache(async (filters: PredictiveFilterState) => {
  return coreGeneratePredictiveInsights(filters);
});

import { AggregationResult } from './types';

export function calculateReadmissionRate(total: number, readmissions: number): number {
  if (total === 0) return 0;
  return (readmissions / total) * 100;
}

export function extractAggregates(agg: AggregationResult) {
  return {
    totalPatients: agg.count,
    avgLengthOfStay: agg.avg_time || 0,
    avgMedications: agg.avg_meds || 0,
    avgEmergencyVisits: agg.avg_er || 0,
    avgProcedures: agg.avg_proc || 0,
  };
}

import { Benchmark } from './types';

export const CMS_BENCHMARKS = {
  READMISSION_RATE: 15.2,
  LENGTH_OF_STAY: 4.5,
  MEDICATION_BURDEN: 10.0,
  ER_UTILIZATION: 5.0,
};

export const INTERNAL_TARGETS = {
  READMISSION_RATE: 10.0,
  LENGTH_OF_STAY: 4.0,
  QUALITY_SCORE: 100,
  POPULATION_HEALTH: 100,
};

export function getReadmissionBenchmark(): Benchmark {
  return {
    metric: 'Readmission %',
    target: INTERNAL_TARGETS.READMISSION_RATE,
    nationalAvg: CMS_BENCHMARKS.READMISSION_RATE,
    tolerance: 2.0,
  };
}

export function calculateVariance(value: number, target: number): string {
  const variance = value - target;
  const sign = variance > 0 ? '+' : '';
  return `${sign}${variance.toFixed(1)}%`;
}

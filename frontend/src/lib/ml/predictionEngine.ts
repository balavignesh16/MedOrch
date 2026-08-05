import { calculateReadmissionRisk, calculateLengthOfStayRisk, calculateHighRiskScore, calculateDemandForecastScore } from '../analytics/scoring';

export function predictReadmission(features: any): { score: number; probability: number } {
  const res = calculateReadmissionRisk(features);
  return { score: res.value, probability: Math.min(100, (res.value / 100) * 80) };
}

export function predictLengthOfStay(features: any): { days: number } {
  const res = calculateLengthOfStayRisk(features);
  // Convert score (10-100) to days (1-20)
  return { days: 1 + (res.value / 100) * 15 };
}

export function predictHighRiskPatient(features: any): { score: number; isHighRisk: boolean } {
  const res = calculateHighRiskScore(features);
  return { score: res.value, isHighRisk: res.value > 65 };
}

export function predictOperationalDemand(hospitalFeatures: any): { demandScore: number } {
  const res = calculateDemandForecastScore(hospitalFeatures);
  return { demandScore: res.value };
}

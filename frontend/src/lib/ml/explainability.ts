export type ConfidenceCategory = 'Very High' | 'High' | 'Medium' | 'Low';

export interface FeatureImportance {
  feature: string;
  importance: number;
  direction: 'positive' | 'negative';
}

export interface ExplainabilityMetadata {
  confidence: number;
  confidenceCategory: ConfidenceCategory;
  topDrivers: FeatureImportance[];
  summary: string;
}

export function classifyConfidence(confidenceScore: number): ConfidenceCategory {
  if (confidenceScore >= 95) return 'Very High';
  if (confidenceScore >= 85) return 'High';
  if (confidenceScore >= 70) return 'Medium';
  return 'Low';
}

export interface ExplainabilityFeatures {
  previousReadmissions?: number;
  medications?: number;
  comorbidities?: number;
  procedureCount?: number;
  age?: number;
}

export function generateExplainability(predictionType: string, confidenceScore: number, features: ExplainabilityFeatures): ExplainabilityMetadata {
  const topDrivers: FeatureImportance[] = [];
  let summary = '';

  if (predictionType === 'Readmission Risk') {
    if ((features.previousReadmissions ?? 0) > 0) {
      topDrivers.push({ feature: 'Previous Readmission', importance: 0.45, direction: 'positive' });
    }
    if ((features.medications ?? 0) > 5) {
      topDrivers.push({ feature: 'Polypharmacy', importance: 0.25, direction: 'positive' });
    }
    if ((features.comorbidities ?? 0) > 2) {
      topDrivers.push({ feature: 'Multiple Comorbidities', importance: 0.20, direction: 'positive' });
    }
    summary = 'Risk driven primarily by clinical history and medication burden.';
  } else if (predictionType === 'Length of Stay') {
    if ((features.procedureCount ?? 0) > 1) {
      topDrivers.push({ feature: 'Multiple Procedures', importance: 0.50, direction: 'positive' });
    }
    if ((features.age ?? 0) > 65) {
      topDrivers.push({ feature: 'Advanced Age', importance: 0.30, direction: 'positive' });
    }
    summary = 'Surgical complexity and age indicate prolonged recovery time.';
  } else {
    topDrivers.push({ feature: 'Baseline Risk', importance: 1.0, direction: 'positive' });
    summary = 'Standard baseline prediction.';
  }

  return {
    confidence: confidenceScore,
    confidenceCategory: classifyConfidence(confidenceScore),
    topDrivers,
    summary
  };
}

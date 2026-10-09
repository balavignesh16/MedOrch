import { ExplainabilityMetadata } from './explainability';

export interface PredictionAuditLog {
  predictionId: string;
  timestamp: string;
  modelVersion: string;
  confidence: number;
  userFilters: Record<string, unknown>;
  inputFeatures: unknown;
  predictionOutput: unknown;
  explainabilityMetadata: ExplainabilityMetadata;
}

export function generateAuditLog(
  predictionId: string,
  modelVersion: string,
  confidence: number,
  inputFeatures: unknown,
  predictionOutput: unknown,
  explainabilityMetadata: ExplainabilityMetadata,
  userFilters: Record<string, unknown> = {}
): PredictionAuditLog {
  const audit = {
    predictionId,
    timestamp: new Date().toISOString(),
    modelVersion,
    confidence,
    userFilters,
    inputFeatures,
    predictionOutput,
    explainabilityMetadata
  };

  // In a real system, this would be asynchronously written to a secure datastore
  // console.log('[AUDIT LOG]', audit);
  return audit;
}

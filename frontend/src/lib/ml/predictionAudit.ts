import { ExplainabilityMetadata } from './explainability';

export interface PredictionAuditLog {
  predictionId: string;
  timestamp: string;
  modelVersion: string;
  confidence: number;
  userFilters: any;
  inputFeatures: any;
  predictionOutput: any;
  explainabilityMetadata: ExplainabilityMetadata;
}

export function generateAuditLog(
  predictionId: string,
  modelVersion: string,
  confidence: number,
  inputFeatures: any,
  predictionOutput: any,
  explainabilityMetadata: ExplainabilityMetadata,
  userFilters: any = {}
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

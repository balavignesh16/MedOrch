import { generateStandardizedFeatures } from './featureEngineering';
import { preprocessFeatures } from './preprocessing';
import { predictReadmission, predictLengthOfStay, predictHighRiskPatient, predictOperationalDemand } from './predictionEngine';
import { generateExplainability, ExplainabilityMetadata } from './explainability';
import { generateAuditLog, PredictionAuditLog } from './predictionAudit';
import { getModelMetadata } from './modelRegistry';
import { modelMonitor } from './modelMonitoring';
import type { DemandForecastFeatures, HighRiskFeatures } from '../analytics/scoring';

export interface MLServiceResponse<T> {
  predictionId: string;
  output: T;
  explainability: ExplainabilityMetadata;
  audit: PredictionAuditLog;
}

function preparePatientFeatures(patientRecord: unknown): HighRiskFeatures {
  const features = preprocessFeatures(generateStandardizedFeatures(patientRecord));
  return {
    age: features.age ?? 50,
    procedureCount: features.procedureCount ?? 0,
    highSeverityDiagnosis: (features.comorbidityCount ?? 0) > 2,
    previousReadmissions: features.inpatientVisits ?? 0,
    comorbidities: features.comorbidityCount ?? 0,
    medications: features.medicationCount ?? 0,
    recentErVisits: features.erVisits ?? 0,
    socialDeterminantsRisk: 10,
  };
}

type PatientRiskPrediction = ReturnType<typeof predictHighRiskPatient>;
type ReadmissionPrediction = ReturnType<typeof predictReadmission>;
type LengthOfStayPrediction = ReturnType<typeof predictLengthOfStay>;
type DemandPrediction = ReturnType<typeof predictOperationalDemand>;

export const mlService = {
  async predictPatientRisk(patientRecord: unknown): Promise<MLServiceResponse<PatientRiskPrediction>> {
    const predictionId = 'pred_' + Math.random().toString(36).substr(2, 9);
    const preprocessed = preparePatientFeatures(patientRecord);
    
    const prediction = predictHighRiskPatient(preprocessed);
    const confidence = 88;
    const explainability = generateExplainability('High Risk', confidence, preprocessed);
    
    const audit = generateAuditLog(predictionId, 'composite_v1', confidence, preprocessed, prediction, explainability);
    modelMonitor.recordPrediction('composite_v1', confidence);
    
    return { predictionId, output: prediction, explainability, audit };
  },

  async predictReadmission(patientRecord: unknown): Promise<MLServiceResponse<ReadmissionPrediction>> {
    const predictionId = 'pred_' + Math.random().toString(36).substr(2, 9);
    const preprocessed = preparePatientFeatures(patientRecord);
    
    const prediction = predictReadmission(preprocessed);
    const metadata = getModelMetadata('readmission_v1');
    const confidence = 92;
    const explainability = generateExplainability('Readmission Risk', confidence, preprocessed);
    
    const audit = generateAuditLog(predictionId, metadata?.version || '1.0', confidence, preprocessed, prediction, explainability);
    modelMonitor.recordPrediction('readmission_v1', confidence);

    return { predictionId, output: prediction, explainability, audit };
  },

  async predictLengthOfStay(patientRecord: unknown): Promise<MLServiceResponse<LengthOfStayPrediction>> {
    const predictionId = 'pred_' + Math.random().toString(36).substr(2, 9);
    const preprocessed = preparePatientFeatures(patientRecord);
    
    const prediction = predictLengthOfStay(preprocessed);
    const metadata = getModelMetadata('los_v2');
    const confidence = 85;
    const explainability = generateExplainability('Length of Stay', confidence, preprocessed);
    
    const audit = generateAuditLog(predictionId, metadata?.version || '2.0', confidence, preprocessed, prediction, explainability);
    modelMonitor.recordPrediction('los_v2', confidence);

    return { predictionId, output: prediction, explainability, audit };
  },

  async predictDemandForecast(hospitalFeatures: DemandForecastFeatures): Promise<MLServiceResponse<DemandPrediction>> {
    const predictionId = 'pred_' + Math.random().toString(36).substr(2, 9);
    const features = hospitalFeatures;
    const prediction = predictOperationalDemand(features);
    const metadata = getModelMetadata('demand_v1');
    const confidence = 80;
    const explainability = generateExplainability('Demand Forecast', confidence, {});
    
    const audit = generateAuditLog(predictionId, metadata?.version || '1.0', confidence, features, prediction, explainability);
    modelMonitor.recordPrediction('demand_v1', confidence);

    return { predictionId, output: prediction, explainability, audit };
  }
};

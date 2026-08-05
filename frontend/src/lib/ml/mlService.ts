import { generateStandardizedFeatures } from './featureEngineering';
import { preprocessFeatures } from './preprocessing';
import { predictReadmission, predictLengthOfStay, predictHighRiskPatient, predictOperationalDemand } from './predictionEngine';
import { generateExplainability } from './explainability';
import { generateAuditLog, PredictionAuditLog } from './predictionAudit';
import { getModelMetadata } from './modelRegistry';
import { modelMonitor } from './modelMonitoring';

export interface MLServiceResponse<T> {
  predictionId: string;
  output: T;
  explainability: any;
  audit: PredictionAuditLog;
}

export const mlService = {
  async predictPatientRisk(patientRecord: any): Promise<MLServiceResponse<any>> {
    const predictionId = 'pred_' + Math.random().toString(36).substr(2, 9);
    const features = generateStandardizedFeatures(patientRecord);
    const preprocessed = preprocessFeatures(features as any);
    
    const prediction = predictHighRiskPatient(preprocessed);
    const confidence = 88;
    const explainability = generateExplainability('High Risk', confidence, preprocessed);
    
    const audit = generateAuditLog(predictionId, 'composite_v1', confidence, preprocessed, prediction, explainability);
    modelMonitor.recordPrediction('composite_v1', confidence);
    
    return { predictionId, output: prediction, explainability, audit };
  },

  async predictReadmission(patientRecord: any): Promise<MLServiceResponse<any>> {
    const predictionId = 'pred_' + Math.random().toString(36).substr(2, 9);
    const features = generateStandardizedFeatures(patientRecord);
    const preprocessed = preprocessFeatures(features as any);
    
    const prediction = predictReadmission(preprocessed);
    const metadata = getModelMetadata('readmission_v1');
    const confidence = 92;
    const explainability = generateExplainability('Readmission Risk', confidence, preprocessed);
    
    const audit = generateAuditLog(predictionId, metadata?.version || '1.0', confidence, preprocessed, prediction, explainability);
    modelMonitor.recordPrediction('readmission_v1', confidence);

    return { predictionId, output: prediction, explainability, audit };
  },

  async predictLengthOfStay(patientRecord: any): Promise<MLServiceResponse<any>> {
    const predictionId = 'pred_' + Math.random().toString(36).substr(2, 9);
    const features = generateStandardizedFeatures(patientRecord);
    const preprocessed = preprocessFeatures(features as any);
    
    const prediction = predictLengthOfStay(preprocessed);
    const metadata = getModelMetadata('los_v2');
    const confidence = 85;
    const explainability = generateExplainability('Length of Stay', confidence, preprocessed);
    
    const audit = generateAuditLog(predictionId, metadata?.version || '2.0', confidence, preprocessed, prediction, explainability);
    modelMonitor.recordPrediction('los_v2', confidence);

    return { predictionId, output: prediction, explainability, audit };
  },

  async predictDemandForecast(hospitalFeatures: any): Promise<MLServiceResponse<any>> {
    const predictionId = 'pred_' + Math.random().toString(36).substr(2, 9);
    const features = hospitalFeatures;
    const prediction = predictOperationalDemand(features);
    const metadata = getModelMetadata('demand_v1');
    const confidence = 80;
    const explainability = generateExplainability('Demand Forecast', confidence, features);
    
    const audit = generateAuditLog(predictionId, metadata?.version || '1.0', confidence, features, prediction, explainability);
    modelMonitor.recordPrediction('demand_v1', confidence);

    return { predictionId, output: prediction, explainability, audit };
  }
};

export interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  status: 'Active' | 'Deprecated' | 'Training' | 'Shadow';
  owner: string;
  trainingDate: string;
  lastUpdated: string;
  supportedPredictionTypes: string[];
  inputFeatures: string[];
  outputType: 'Binary' | 'Continuous' | 'Multiclass';
  accuracy: number;
  confidenceRange: [number, number];
  fallbackStrategy: string;
}

export const MODEL_REGISTRY: Record<string, ModelMetadata> = {
  'readmission_v1': {
    id: 'readmission_v1',
    name: '30-Day Readmission Risk Model',
    version: '1.4.2',
    status: 'Active',
    owner: 'MedOrch ML Team',
    trainingDate: '2026-06-15',
    lastUpdated: '2026-07-20',
    supportedPredictionTypes: ['Readmission Risk'],
    inputFeatures: ['Age', 'Comorbidities', 'Previous Readmissions', 'Medications', 'Recent ER Visits'],
    outputType: 'Continuous',
    accuracy: 94.2,
    confidenceRange: [70, 99],
    fallbackStrategy: 'Heuristic Rule Engine'
  },
  'los_v2': {
    id: 'los_v2',
    name: 'Length of Stay Predictor',
    version: '2.1.0',
    status: 'Active',
    owner: 'MedOrch Clinical Data Science',
    trainingDate: '2026-07-01',
    lastUpdated: '2026-08-01',
    supportedPredictionTypes: ['Length of Stay'],
    inputFeatures: ['Age', 'Procedure Complexity', 'Diagnosis Severity', 'Admission Type'],
    outputType: 'Continuous',
    accuracy: 88.5,
    confidenceRange: [60, 95],
    fallbackStrategy: 'Average LOS per DRG'
  },
  'demand_v1': {
    id: 'demand_v1',
    name: 'Hospital Capacity Demand Forecaster',
    version: '1.0.1',
    status: 'Shadow',
    owner: 'Operations Analytics',
    trainingDate: '2026-05-10',
    lastUpdated: '2026-07-15',
    supportedPredictionTypes: ['Bed Demand', 'ER Volume'],
    inputFeatures: ['Historical Volume', 'Seasonality', 'Local Events', 'Current Census'],
    outputType: 'Continuous',
    accuracy: 82.4,
    confidenceRange: [50, 90],
    fallbackStrategy: 'Historical 7-Day Moving Average'
  }
};

export function getModelMetadata(modelId: string): ModelMetadata | undefined {
  return MODEL_REGISTRY[modelId];
}

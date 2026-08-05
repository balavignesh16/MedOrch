export const RISK_LEVELS = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
} as const;

export const KPI_STATUS = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  WATCH: 'Watch',
  CRITICAL: 'Critical',
} as const;

export const SEVERITY = {
  POSITIVE: 'Positive',
  WARNING: 'Warning',
  CRITICAL: 'Critical',
  INFO: 'Info',
} as const;

export const TREND_INDICATORS = {
  UP: 'up',
  DOWN: 'down',
  FLAT: 'flat',
} as const;

export const MODULES = {
  CLINICAL_RISK: 'Clinical Risk',
  READMISSION_INTELLIGENCE: 'Readmission Intelligence',
  MEDICATION_QUALITY: 'Medication Quality',
  UTILIZATION_ANALYSIS: 'Utilization Analysis',
  QUALITY_OVERVIEW: 'Quality Overview',
  RISK_SEGMENTATION: 'Risk Segmentation',
  DISEASE_INTELLIGENCE: 'Disease Intelligence',
  DEMOGRAPHIC_ANALYTICS: 'Demographic Analytics',
  POPULATION_OVERVIEW: 'Population Overview',
} as const;

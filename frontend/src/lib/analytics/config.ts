export const SCORING_CONFIG = {
  POPULATION_HEALTH: {
    BASE_SCORE: 100,
    HIGH_RISK_WEIGHT: 0.3,
    READMISSION_WEIGHT: 0.4,
    LOS_WEIGHT: 2,
    LOS_MAX_DEDUCTION: 20,
    MEDS_MAX_DEDUCTION: 10,
    ER_WEIGHT: 5,
    ER_MAX_DEDUCTION: 20,
  },
  CLINICAL_QUALITY: {
    BASE_SCORE: 100,
    READMISSION_WEIGHT: 1.5,
    READMISSION_MAX_DEDUCTION: 30,
    LOS_BASELINE: 4,
    LOS_WEIGHT: 2,
    LOS_MAX_DEDUCTION: 20,
    MEDS_BASELINE: 10,
    MEDS_WEIGHT: 1,
    MEDS_MAX_DEDUCTION: 20,
    ER_WEIGHT: 10,
    ER_MAX_DEDUCTION: 15,
    RISK_WEIGHT: 0.5,
    RISK_MAX_DEDUCTION: 15,
  },
  OPERATIONAL_INTELLIGENCE: {
    BASE_SCORE: 100,
    THROUGHPUT_TARGET: 50,
    BED_UTIL_TARGET: 85, // %
    LOS_TARGET: 4.0,
    ER_TARGET: 15, // %
    INPATIENT_TARGET: 20,
    OUTPATIENT_TARGET: 60,
  }
};

export const RISK_BOUNDARIES = {
  READMISSION_HIGH: 20,
  READMISSION_MEDIUM: 15,
  READMISSION_LOW: 10,
  LOS_HIGH: 7,
  LOS_MEDIUM: 5,
  LOS_LOW: 3,
};

export const ENCOUNTER_RISK_CASE_SQL = `CASE
  WHEN (time_in_hospital > 7 OR number_emergency > 2 OR num_medications > 20) THEN 'Critical'
  WHEN (time_in_hospital > 5 OR number_emergency > 0 OR num_medications > 15) THEN 'High'
  WHEN (time_in_hospital > 3 OR num_medications > 10) THEN 'Medium'
  ELSE 'Low'
END`;

export const ENCOUNTER_RISK_FILTER_SQL = {
  Critical: `(${ENCOUNTER_RISK_CASE_SQL}) = 'Critical'`,
  High: `(${ENCOUNTER_RISK_CASE_SQL}) = 'High'`,
  Medium: `(${ENCOUNTER_RISK_CASE_SQL}) = 'Medium'`,
  Low: `(${ENCOUNTER_RISK_CASE_SQL}) = 'Low'`,
} as const;

export const HIGH_RISK_ENCOUNTER_SQL = `(${ENCOUNTER_RISK_CASE_SQL}) IN ('High', 'Critical')`;

export const HEALTH_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  WATCH: 60,
};

export const FINANCIAL_COST_MULTIPLIERS = {
  BASE_ENCOUNTER: 100,
  LOS_PER_DAY: 25,
  MEDICATION: 3,
  LAB_PROCEDURE: 5,
  CLINICAL_PROCEDURE: 20,
  EMERGENCY_VISIT: 30,
  INPATIENT_VISIT: 40,
  OUTPATIENT_VISIT: 5,
  READMISSION_PENALTY: 50
} as const;

export const FINANCIAL_MODEL_METADATA = {
  VERSION: 'demo-v1',
  UNIT: 'illustrative dollar-denominated relative cost units',
  CLASSIFICATION: 'Estimated / synthetic demo model',
} as const;

export const OPERATIONAL_DEMO_ASSUMPTIONS = {
  THROUGHPUT_PERIOD_DAYS: 30,
  BED_OCCUPANCY_BASE_PERCENT: 70,
  BED_OCCUPANCY_LOS_WEIGHT: 2,
  RESOURCE_EFFICIENCY_PERCENT: 85,
  WORKFLOW_EFFICIENCY_PERCENT: 88,
  FLOW: {
    emergency: { volume: 0.4, queue: 0.08 },
    ward: { volume: 0.55, queue: 0.02 },
    procedure: { volume: 0.3, queue: 0.04 },
    discharge: { volume: 0.95, queue: 0.06 },
  },
} as const;

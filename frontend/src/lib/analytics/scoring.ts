import { SCORING_CONFIG } from './config';
import { Score } from './types';
import { clampScore } from './validators';

export function calculatePopulationHealthIndex(metrics: {
  highRiskPercent: number;
  readmissionPercent: number;
  avgLengthOfStay: number;
  avgMedications: number;
  avgEmergencyVisits: number;
}): number {
  const config = SCORING_CONFIG.POPULATION_HEALTH;
  let healthIndex = config.BASE_SCORE;
  
  healthIndex -= (metrics.highRiskPercent * config.HIGH_RISK_WEIGHT);
  healthIndex -= (metrics.readmissionPercent * config.READMISSION_WEIGHT);
  healthIndex -= Math.min(metrics.avgLengthOfStay * config.LOS_WEIGHT, config.LOS_MAX_DEDUCTION);
  healthIndex -= Math.min(metrics.avgMedications, config.MEDS_MAX_DEDUCTION);
  healthIndex -= Math.min(metrics.avgEmergencyVisits * config.ER_WEIGHT, config.ER_MAX_DEDUCTION);
  
  return clampScore(healthIndex);
}

export function calculateClinicalQualityScore(metrics: {
  readmissionRate: number;
  avgLos: number;
  avgMeds: number;
  erVisits: number;
  highRiskPercent: number;
}): Score {
  const config = SCORING_CONFIG.CLINICAL_QUALITY;
  
  const readmissionDeduction = Math.min(metrics.readmissionRate * config.READMISSION_WEIGHT, config.READMISSION_MAX_DEDUCTION);
  const losDeduction = Math.min(Math.max(0, (metrics.avgLos - config.LOS_BASELINE) * config.LOS_WEIGHT), config.LOS_MAX_DEDUCTION);
  const medsDeduction = Math.min(Math.max(0, (metrics.avgMeds - config.MEDS_BASELINE) * config.MEDS_WEIGHT), config.MEDS_MAX_DEDUCTION);
  const erDeduction = Math.min(metrics.erVisits * config.ER_WEIGHT, config.ER_MAX_DEDUCTION);
  const riskDeduction = Math.min(metrics.highRiskPercent * config.RISK_WEIGHT, config.RISK_MAX_DEDUCTION);

  const totalDeduction = readmissionDeduction + losDeduction + medsDeduction + erDeduction + riskDeduction;
  const score = clampScore(Math.round(config.BASE_SCORE - totalDeduction));

  return {
    value: score,
    breakdown: {
      readmission: -Math.round(readmissionDeduction),
      los: -Math.round(losDeduction),
      meds: -Math.round(medsDeduction),
      er: -Math.round(erDeduction),
      highRisk: -Math.round(riskDeduction)
    }
  };
}

export function calculateFinancialScore(metrics: {
  avgCost: number;
  readmissionCostPercent: number;
  highRiskCostPercent: number;
  erCostPercent: number;
}): Score {
  // Using an arbitrary target average cost of $2500 for benchmarking
  const targetAvgCost = 2500;
  
  let score = 100;
  const breakdown = {
    costEfficiency: 0,
    readmission: 0,
    highRisk: 0,
    erUtilization: 0
  };

  // Cost efficiency deduction
  if (metrics.avgCost > targetAvgCost) {
    breakdown.costEfficiency = Math.min(30, ((metrics.avgCost - targetAvgCost) / targetAvgCost) * 50);
    score -= breakdown.costEfficiency;
  }

  // Readmission cost deduction
  breakdown.readmission = Math.min(25, (metrics.readmissionCostPercent / 100) * 50);
  score -= breakdown.readmission;

  // High risk cost deduction
  breakdown.highRisk = Math.min(20, (metrics.highRiskCostPercent / 100) * 40);
  score -= breakdown.highRisk;

  // ER cost deduction
  breakdown.erUtilization = Math.min(15, (metrics.erCostPercent / 100) * 60);
  score -= breakdown.erUtilization;

  return {
    value: clampScore(score),
    breakdown: {
      costEfficiency: Math.round(breakdown.costEfficiency),
      readmission: Math.round(breakdown.readmission),
      highRisk: Math.round(breakdown.highRisk),
      erUtilization: Math.round(breakdown.erUtilization)
    }
  };
}

export interface OperationalMetrics {
  throughput: number;
  bedUtilization: number;
  erLoad: number;
  inpatientLoad: number;
  outpatientLoad: number;
  avgLos: number;
  resourceEfficiency: number;
  workflowEfficiency: number;
}

export function calculateOperationalScore(metrics: OperationalMetrics): ScoreResult {
  let score = 100;
  const breakdown = {
    throughput: 0,
    bedUtilization: 0,
    erLoad: 0,
    losEfficiency: 0,
    resourceEfficiency: 0,
    workflowEfficiency: 0
  };

  // Deduct based on throughput (assume <30/day is bad)
  if (metrics.throughput < 30) {
    breakdown.throughput = Math.min(20, (30 - metrics.throughput) * 1.5);
    score -= breakdown.throughput;
  }

  // Deduct based on bed utilization (assume >85% is bad)
  if (metrics.bedUtilization > 85) {
    breakdown.bedUtilization = Math.min(20, (metrics.bedUtilization - 85) * 1.5);
    score -= breakdown.bedUtilization;
  }

  // Deduct based on ER load (assume >15% is bad)
  if (metrics.erLoad > 15) {
    breakdown.erLoad = Math.min(15, (metrics.erLoad - 15) * 2);
    score -= breakdown.erLoad;
  }

  // Deduct based on average length of stay (assume >4.5 is bad)
  if (metrics.avgLos > 4.5) {
    breakdown.losEfficiency = Math.min(20, (metrics.avgLos - 4.5) * 5);
    score -= breakdown.losEfficiency;
  }

  // Deduct based on resource efficiency (assume <85% is bad)
  if (metrics.resourceEfficiency < 85) {
    breakdown.resourceEfficiency = Math.min(15, (85 - metrics.resourceEfficiency) * 1.5);
    score -= breakdown.resourceEfficiency;
  }

  // Deduct based on workflow efficiency (assume <85% is bad)
  if (metrics.workflowEfficiency < 85) {
    breakdown.workflowEfficiency = Math.min(10, (85 - metrics.workflowEfficiency) * 1.5);
    score -= breakdown.workflowEfficiency;
  }

  return {
    value: clampScore(score),
    breakdown: {
      throughput: Math.round(breakdown.throughput),
      bedUtilization: Math.round(breakdown.bedUtilization),
      erLoad: Math.round(breakdown.erLoad),
      losEfficiency: Math.round(breakdown.losEfficiency),
      resourceEfficiency: Math.round(breakdown.resourceEfficiency),
      workflowEfficiency: Math.round(breakdown.workflowEfficiency)
    }
  };
}

// --- Predictive Scoring Models ---

export function calculateReadmissionRisk(patientFeatures: any): ScoreResult {
  // Synthetic model based on features
  let score = 20;
  const breakdown = { prevReadmissions: 0, comorbidities: 0, medications: 0, recentEr: 0 };

  if (patientFeatures.previousReadmissions > 0) {
    breakdown.prevReadmissions = Math.min(40, patientFeatures.previousReadmissions * 20);
    score += breakdown.prevReadmissions;
  }
  if (patientFeatures.comorbidities > 2) {
    breakdown.comorbidities = Math.min(20, (patientFeatures.comorbidities - 2) * 5);
    score += breakdown.comorbidities;
  }
  if (patientFeatures.medications > 5) {
    breakdown.medications = Math.min(10, (patientFeatures.medications - 5) * 2);
    score += breakdown.medications;
  }
  if (patientFeatures.recentErVisits > 0) {
    breakdown.recentEr = Math.min(10, patientFeatures.recentErVisits * 5);
    score += breakdown.recentEr;
  }

  return { value: clampScore(score), breakdown };
}

export function calculateLengthOfStayRisk(patientFeatures: any): ScoreResult {
  let score = 10;
  const breakdown = { ageRisk: 0, procedureComplexity: 0, diagnosisSeverity: 0 };

  if (patientFeatures.age > 65) {
    breakdown.ageRisk = Math.min(30, (patientFeatures.age - 65) * 1.5);
    score += breakdown.ageRisk;
  }
  if (patientFeatures.procedureCount > 1) {
    breakdown.procedureComplexity = Math.min(30, patientFeatures.procedureCount * 10);
    score += breakdown.procedureComplexity;
  }
  if (patientFeatures.highSeverityDiagnosis) {
    breakdown.diagnosisSeverity = 30;
    score += breakdown.diagnosisSeverity;
  }

  return { value: clampScore(score), breakdown };
}

export function calculateHighRiskScore(patientFeatures: any): ScoreResult {
  const readmission = calculateReadmissionRisk(patientFeatures).value;
  const los = calculateLengthOfStayRisk(patientFeatures).value;
  
  // Composite risk score favoring the higher of the two, plus intrinsic risk
  let score = Math.max(readmission, los) * 0.7 + (patientFeatures.socialDeterminantsRisk || 10);
  
  return { 
    value: clampScore(score),
    breakdown: { readmissionDriver: readmission, losDriver: los }
  };
}

export function calculateDemandForecastScore(hospitalFeatures: any): ScoreResult {
  let score = 50;
  const breakdown = { seasonalTrend: 0, historicalVolume: 0, localEvents: 0 };

  if (hospitalFeatures.winterSeason) {
    breakdown.seasonalTrend = 20;
    score += 20;
  }
  if (hospitalFeatures.recentVolumeSpike) {
    breakdown.historicalVolume = 25;
    score += 25;
  }

  return { value: clampScore(score), breakdown };
}

export interface AdministrativeMetrics {
  departmentPerformance: number;
  staffingEfficiency: number;
  capacityUtilization: number;
  resourceAllocation: number;
  workflowEfficiency: number;
  complianceHealth: number;
}

export function calculateAdministrativeScore(metrics: AdministrativeMetrics): Score {
  let score = 100;
  const breakdown = {
    department: 0,
    staffing: 0,
    capacity: 0,
    compliance: 0,
    workflow: 0,
    governance: 0
  };

  if (metrics.departmentPerformance < 90) {
    breakdown.department = Math.min(20, (90 - metrics.departmentPerformance) * 1.5);
    score -= breakdown.department;
  }
  if (metrics.staffingEfficiency < 90) {
    breakdown.staffing = Math.min(20, (90 - metrics.staffingEfficiency) * 1.5);
    score -= breakdown.staffing;
  }
  if (metrics.capacityUtilization < 85) {
    breakdown.capacity = Math.min(15, (85 - metrics.capacityUtilization) * 1.2);
    score -= breakdown.capacity;
  }
  if (metrics.complianceHealth < 95) {
    breakdown.compliance = Math.min(25, (95 - metrics.complianceHealth) * 2);
    score -= breakdown.compliance;
  }
  if (metrics.workflowEfficiency < 90) {
    breakdown.workflow = Math.min(10, (90 - metrics.workflowEfficiency) * 1.2);
    score -= breakdown.workflow;
  }
  if (metrics.resourceAllocation < 90) {
    breakdown.governance = Math.min(10, (90 - metrics.resourceAllocation) * 1.2);
    score -= breakdown.governance;
  }

  score = clampScore(score);
  let grade = 'D';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';

  return {
    value: score,
    breakdown: {
      department: Math.round(breakdown.department),
      staffing: Math.round(breakdown.staffing),
      capacity: Math.round(breakdown.capacity),
      compliance: Math.round(breakdown.compliance),
      workflow: Math.round(breakdown.workflow),
      governance: Math.round(breakdown.governance)
    },
    grade
  };
}

export interface EnterpriseReadinessMetrics {
  clinicalScore: number;
  financialScore: number;
  operationalScore: number;
  administrativeScore: number;
  predictiveScore: number;
  governanceScore: number;
}

export function calculateEnterpriseReadinessScore(metrics: EnterpriseReadinessMetrics): ScoreResult & { weights: Record<string, number> } {
  const weights = {
    clinical: 0.25,
    financial: 0.20,
    operational: 0.20,
    administrative: 0.15,
    predictive: 0.10,
    governance: 0.10
  };

  const score = (
    metrics.clinicalScore * weights.clinical +
    metrics.financialScore * weights.financial +
    metrics.operationalScore * weights.operational +
    metrics.administrativeScore * weights.administrative +
    metrics.predictiveScore * weights.predictive +
    metrics.governanceScore * weights.governance
  );

  let grade = 'D';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';

  return {
    value: clampScore(Math.round(score)),
    breakdown: {
      clinical: Math.round(metrics.clinicalScore * weights.clinical),
      financial: Math.round(metrics.financialScore * weights.financial),
      operational: Math.round(metrics.operationalScore * weights.operational),
      administrative: Math.round(metrics.administrativeScore * weights.administrative),
      predictive: Math.round(metrics.predictiveScore * weights.predictive),
      governance: Math.round(metrics.governanceScore * weights.governance)
    },
    grade,
    weights
  };
}

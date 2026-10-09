import { AnalyticsFilterState, Insight, StrategicInsight } from './types';
import { MODULES, SEVERITY } from './constants';
import { HEALTH_THRESHOLDS } from './config';

export function generateHealthIndexInsights(healthIndex: number): Insight[] {
  const insights: Insight[] = [];
  
  if (healthIndex < HEALTH_THRESHOLDS.WATCH) {
    insights.push({
      title: "Critical Health Index",
      severity: SEVERITY.CRITICAL,
      confidence: 95,
      supportingMetric: `${healthIndex.toFixed(0)}/100 Index Score`,
      businessImpact: "The configured demonstration index is below its internal review threshold.",
      recommendedAction: "Review the underlying encounter-level metrics; do not use this heuristic for clinical decisions.",
      relatedDashboard: MODULES.RISK_SEGMENTATION
    });
  } else {
    insights.push({
      title: "Stable Health Index",
      severity: SEVERITY.POSITIVE,
      confidence: 92,
      supportingMetric: `${healthIndex.toFixed(0)}/100 Index Score`,
      affectedPopulation: "Population health is within manageable operational thresholds.",
      recommendedAction: "Continue current care management protocols.",
      relatedDashboard: MODULES.RISK_SEGMENTATION,
      timestamp: "Just now"
    });
  }
  return insights;
}

export function generateDiseaseInsights(topDisease: { disease: string, riskLevel: string }): Insight[] {
  if (!topDisease) return [];
  
  return [{
    title: `High Volume Diagnosis: ${topDisease.disease}`,
    severity: topDisease.riskLevel === 'Critical' ? SEVERITY.CRITICAL : topDisease.riskLevel === 'High' ? SEVERITY.WARNING : SEVERITY.INFO,
    confidence: 88,
    supportingMetric: "Highest frequency in selected cohort",
    clinicalImpact: "This diagnosis has the highest encounter frequency in the selected cohort.",
    recommendedAction: "Review the source encounter distribution before drawing operational conclusions.",
    relatedDashboard: MODULES.DISEASE_INTELLIGENCE
  }];
}

export function generateQualityInsights(readmissionRate: number, highRiskCount: number, topReadmissionCohort: string): Insight[] {
  void topReadmissionCohort;
  const insights: Insight[] = [];

  if (highRiskCount > 0) {
    insights.push({
      title: "High Risk Encounter Heuristic",
      severity: SEVERITY.CRITICAL,
      confidence: 95,
      supportingMetric: `${highRiskCount.toLocaleString()} High Risk Encounters`,
      clinicalImpact: "These encounters match the configured LOS, emergency-use, or medication-count rule.",
      recommendedAction: "Review the underlying records; this heuristic is not a clinical risk prediction.",
      affectedPatients: highRiskCount,
      relatedDashboard: MODULES.CLINICAL_RISK
    });
  }

  if (readmissionRate > 15) {
    insights.push({
      title: "Readmission Proxy Above Demo Reference",
      severity: SEVERITY.WARNING,
      confidence: 92,
      supportingMetric: `${readmissionRate.toFixed(1)}% <30-Day Proxy`,
      clinicalImpact: "The source category exceeds the configured 15% demonstration reference.",
      recommendedAction: "Inspect the contributing encounter categories; no regulatory conclusion is supported.",
      affectedPatients: highRiskCount,
      relatedDashboard: MODULES.READMISSION_INTELLIGENCE
    });
  } else {
    insights.push({
      title: "Readmission Proxy Within Demo Reference",
      severity: SEVERITY.POSITIVE,
      confidence: 92,
      supportingMetric: `${readmissionRate.toFixed(1)}% <30-Day Proxy`,
      clinicalImpact: "The source category is within the configured 15% demonstration reference.",
      recommendedAction: "Continue monitoring the source data without inferring regulatory performance.",
      affectedPatients: highRiskCount,
      relatedDashboard: MODULES.READMISSION_INTELLIGENCE
    });
  }

  return insights;
}

export function generateFinancialInsights(metrics: {
  totalCost: number;
  avgCost: number;
  readmissionCost: number;
  erCost: number;
  polypharmacyCost: number;
  highRiskCount: number;
}): Insight[] {
  const insights: Insight[] = [];

  insights.push({
    title: "Estimated Readmission Weight",
    severity: metrics.readmissionCost > (metrics.totalCost * 0.15) ? SEVERITY.CRITICAL : SEVERITY.WARNING,
    confidence: 96,
    supportingMetric: `$${(metrics.readmissionCost / 1000).toFixed(1)}k Readmission Cost`,
    businessImpact: "This is the readmission component of the synthetic relative-cost model.",
    recommendedAction: "Review model inputs; do not interpret this value as an actual financial penalty.",
    relatedDashboard: "Financial Dashboard"
  });

  insights.push({
    title: "Estimated Emergency Utilization Weight",
    severity: metrics.erCost > (metrics.totalCost * 0.1) ? SEVERITY.WARNING : SEVERITY.INFO,
    confidence: 90,
    supportingMetric: `$${(metrics.erCost / 1000).toFixed(1)}k ER Utilization Cost`,
    businessImpact: "This is the emergency-visit component of the synthetic relative-cost model.",
    recommendedAction: "Review recorded utilization before considering operational action.",
    relatedDashboard: "Resource Utilization"
  });

  insights.push({
    title: "Estimated Medication Weight",
    severity: metrics.polypharmacyCost > (metrics.totalCost * 0.05) ? SEVERITY.WARNING : SEVERITY.INFO,
    confidence: 88,
    supportingMetric: `$${(metrics.polypharmacyCost / 1000).toFixed(1)}k Polypharmacy Cost`,
    businessImpact: "This is the medication-count component of the synthetic relative-cost model.",
    recommendedAction: "Review source records; this estimate does not establish cost or clinical risk.",
    relatedDashboard: "Resource Utilization"
  });

  insights.push({
    title: "High-Cost Cohort Concentration",
    severity: SEVERITY.CRITICAL,
    confidence: 98,
    supportingMetric: `${metrics.highRiskCount.toLocaleString()} High Risk Encounters`,
    businessImpact: "These encounters match the configured utilization heuristic.",
    recommendedAction: "Inspect encounter-level drivers; no expenditure concentration is established.",
    relatedDashboard: "High Cost Cohorts"
  });

  insights.push({
    title: "Overall Cost Efficiency",
    severity: metrics.avgCost > 3000 ? SEVERITY.CRITICAL : metrics.avgCost > 2000 ? SEVERITY.WARNING : SEVERITY.POSITIVE,
    confidence: 94,
    supportingMetric: `$${metrics.avgCost.toFixed(0)} Avg Cost/Encounter`,
    businessImpact: "This score summarizes configured synthetic cost weights.",
    recommendedAction: "Use only for demonstration and model comparison.",
    relatedDashboard: "Cost Intelligence"
  });

  return insights;
}

export function generateOperationalInsights(filters: AnalyticsFilterState): Insight[] {
  void filters;
  return [{
    title: 'Operational Scenario Demonstration',
    severity: SEVERITY.INFO,
    confidence: 0,
    supportingMetric: 'No live operational feed connected',
    operationalImpact: 'Capacity, flow, staffing, and delay scenarios are synthetic.',
    recommendedAction: 'Connect validated operational sources before making operational decisions.',
    relatedDashboard: 'Operational Dashboard',
  }];
}

export interface PredictiveInsight {
  title: string;
  severity: string;
  confidence: number;
  predictedMetric: string;
  supportingFeatures: string;
  riskScore: number;
  recommendedAction: string;
  relatedDashboard: string;
}

export function generatePredictiveInsights(filters: AnalyticsFilterState): PredictiveInsight[] {
  void filters;
  const insights: PredictiveInsight[] = [];

  insights.push({
    title: 'High Readmission Probability Cohort',
    severity: SEVERITY.CRITICAL,
    confidence: 92,
    predictedMetric: '34% Readmission Rate',
    supportingFeatures: 'Previous Readmission, Heart Failure, Polypharmacy',
    riskScore: 88,
    recommendedAction: 'Enroll in intensive post-discharge 30-day monitoring program.',
    relatedDashboard: 'High Risk Patients'
  });

  insights.push({
    title: 'Predicted Bed Capacity Shortfall',
    severity: SEVERITY.CRITICAL,
    confidence: 89,
    predictedMetric: 'Deficit of 12 ICU Beds in 48h',
    supportingFeatures: 'High Admission Velocity, Prolonged LOS, Seasonal Trend',
    riskScore: 95,
    recommendedAction: 'Identify ICU downgrade candidates and accelerate ward transfers.',
    relatedDashboard: 'Demand Forecast'
  });

  insights.push({
    title: 'Prolonged LOS Risk in Orthopedics',
    severity: SEVERITY.WARNING,
    confidence: 85,
    predictedMetric: '+2.5 Days Excess LOS',
    supportingFeatures: 'Age > 75, Comorbidity Count > 3, Delayed PT Evaluation',
    riskScore: 78,
    recommendedAction: 'Initiate Physical Therapy consults on Post-Op Day 0.',
    relatedDashboard: 'High Risk Patients'
  });

  insights.push({
    title: 'Sepsis Deterioration Risk',
    severity: SEVERITY.CRITICAL,
    confidence: 94,
    predictedMetric: 'Elevated Mortality Risk',
    supportingFeatures: 'Rising Lactic Acid, Hypotension, Altered Mental Status',
    riskScore: 98,
    recommendedAction: 'Activate rapid response team and initiate sepsis bundle.',
    relatedDashboard: 'Intervention Center'
  });

  insights.push({
    title: 'Weekend Staffing Mismatch',
    severity: SEVERITY.WARNING,
    confidence: 82,
    predictedMetric: '15% Nurse Shortage',
    supportingFeatures: 'Historical Call-Out Rates, High Acuity Census',
    riskScore: 72,
    recommendedAction: 'Pre-book agency nursing staff for upcoming weekend shift.',
    relatedDashboard: 'Demand Forecast'
  });

  return insights;
}

export function generateAdministrativeInsights(filters: AnalyticsFilterState): Insight[] {
  void filters;
  const insights: Insight[] = [];

  insights.push({
    title: 'Staffing Mismatch in ICU',
    severity: SEVERITY.CRITICAL,
    confidence: 96,
    supportingMetric: '1:4 Nurse-to-Patient Ratio',
    operationalImpact: 'Severe risk to critical care quality and potential for staff burnout.',
    recommendedAction: 'Immediate deployment of cross-trained float pool to ICU.',
    relatedDashboard: 'Staffing Intelligence',
    affectedPopulation: 'Intensive Care Unit'
  });

  insights.push({
    title: 'Compliance Audit Vulnerability',
    severity: SEVERITY.WARNING,
    confidence: 89,
    supportingMetric: '82% Documentation Completeness',
    operationalImpact: 'High risk of regulatory penalties during next JCAHO audit.',
    recommendedAction: 'Mandate targeted EHR training for non-compliant departments.',
    relatedDashboard: 'Compliance Dashboard',
    affectedPopulation: 'Emergency Department'
  });

  insights.push({
    title: 'Operating Room Block Underutilization',
    severity: SEVERITY.WARNING,
    confidence: 92,
    supportingMetric: '65% Block Utilization',
    operationalImpact: 'Lost revenue potential and extended waitlists for elective surgeries.',
    recommendedAction: 'Implement dynamic block reallocation 72 hours prior to scheduled surgery.',
    relatedDashboard: 'Department Scorecards',
    affectedPopulation: 'Surgery'
  });

  insights.push({
    title: 'Post-Acute Placement Bottleneck',
    severity: SEVERITY.INFO,
    confidence: 88,
    supportingMetric: '2.8 Days Excess LOS',
    operationalImpact: 'Reduced inpatient throughput and increased uncompensated care costs.',
    recommendedAction: 'Expand preferred provider network for Skilled Nursing Facilities (SNF).',
    relatedDashboard: 'Capacity Allocation',
    affectedPopulation: 'Orthopedics'
  });

  insights.push({
    title: 'Optimal Governance Protocol Adherence',
    severity: SEVERITY.POSITIVE,
    confidence: 95,
    supportingMetric: '98% Protocol Adherence',
    operationalImpact: 'High operational readiness and minimized administrative risk.',
    recommendedAction: 'Maintain current governance oversight protocols.',
    relatedDashboard: 'Administration Governance',
    affectedPopulation: 'Cardiology'
  });

  return insights;
}

export function generateStrategicInsights(): StrategicInsight[] {
  return [
    {
      title: 'Targeted Readmission Reduction',
      priority: 'Immediate',
      supportingKpi: '15.2% Readmission Rate',
      expectedImpact: 'Reduce uncompensated care by $2.4M annually',
      recommendedAction: 'Deploy cross-functional transition-of-care teams for High-Risk Heart Failure cohorts.',
      timeframe: '0-30 Days',
      confidence: 96,
      relatedModule: 'Clinical Quality'
    },
    {
      title: 'Post-Acute Network Expansion',
      priority: 'Short Term',
      supportingKpi: '+2.4 Days Excess LOS',
      expectedImpact: 'Unlock 18 inpatient beds daily by eliminating discharge bottlenecks',
      recommendedAction: 'Establish preferred provider agreements with 3 regional Skilled Nursing Facilities.',
      timeframe: '1-3 Months',
      confidence: 92,
      relatedModule: 'Operational Capacity'
    },
    {
      title: 'High-Cost Cohort Intensive Management',
      priority: 'Short Term',
      supportingKpi: 'Top 5% drive 48% of costs',
      expectedImpact: 'Reduce avoidable ER utilization by 22% in the top decile',
      recommendedAction: 'Enroll top 5% highest-cost patients in pharmacist-led medication reconciliation.',
      timeframe: '1-3 Months',
      confidence: 89,
      relatedModule: 'Financial Intelligence'
    },
    {
      title: 'Predictive Staffing Realignment',
      priority: 'Mid Term',
      supportingKpi: 'Weekend Staffing Mismatch',
      expectedImpact: 'Decrease overtime dependency by 14% while improving quality scores',
      recommendedAction: 'Transition from fixed to acuity-based predictive staffing models for Med-Surg.',
      timeframe: '3-12 Months',
      confidence: 85,
      relatedModule: 'Administrative Governance'
    },
    {
      title: 'Value-Based Contract Renegotiation',
      priority: 'Long Term',
      supportingKpi: '98% Protocol Adherence',
      expectedImpact: 'Capture $4.5M in shared savings bonuses',
      recommendedAction: 'Leverage current high compliance scores to negotiate favorable capitated rates.',
      timeframe: '>1 Year',
      confidence: 94,
      relatedModule: 'Enterprise Strategy'
    }
  ];
}

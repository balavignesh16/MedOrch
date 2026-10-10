import { AnalyticsFilterState, Insight } from './types';
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

import type {
  FairnessAttribute,
  GlobalImportanceEntry,
  ReadmissionExplanations,
  ReadmissionMetrics,
  ThresholdMetrics,
} from './modelArtifactTypes';

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatDecimal(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  return value.toFixed(digits);
}

export function formatInterval(interval: readonly [number, number] | undefined, digits = 3): string {
  if (!interval) return 'n/a';
  return `${interval[0].toFixed(digits)} – ${interval[1].toFixed(digits)}`;
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

export type ThresholdKey = 'default_0.5' | 'max_f1' | 'top_decile';

export interface ThresholdOption {
  key: ThresholdKey;
  label: string;
  description: string;
  metrics: ThresholdMetrics;
}

export function thresholdOptions(metrics: ReadmissionMetrics): ThresholdOption[] {
  const analysis = metrics.threshold_analysis;
  return [
    {
      key: 'default_0.5',
      label: 'Default 0.5',
      description: 'The textbook cutoff. Shown for comparison: with 11% prevalence almost nothing reaches 0.5.',
      metrics: analysis['default_0.5'],
    },
    {
      key: 'max_f1',
      label: 'Max F1 (operating)',
      description: 'Cutoff that best balances precision and recall, chosen on the validation set.',
      metrics: analysis.max_f1,
    },
    {
      key: 'top_decile',
      label: 'Top 10% capacity',
      description: 'Cutoff that flags the highest-risk 10% — a realistic follow-up capacity limit.',
      metrics: analysis.top_decile,
    },
  ];
}

export function confusionCells(metrics: ThresholdMetrics): { tn: number; fp: number; fn: number; tp: number } {
  const [[tn, fp], [fn, tp]] = metrics.confusion_matrix;
  return { tn, fp, fn, tp };
}

export function buildRocSeries(metrics: ReadmissionMetrics): Array<{ fpr: number; tpr: number }> {
  return metrics.roc_curve.map((point) => ({ fpr: point.fpr, tpr: point.tpr }));
}

export function buildPrSeries(metrics: ReadmissionMetrics): Array<{ recall: number; precision: number }> {
  return metrics.pr_curve.map((point) => ({ recall: point.recall, precision: point.precision }));
}

export function buildCalibrationSeries(
  metrics: ReadmissionMetrics,
): Array<{ predicted: number; observed: number; count: number }> {
  return metrics.calibration_curve.map((bin) => ({
    predicted: bin.mean_predicted,
    observed: bin.observed_rate,
    count: bin.count,
  }));
}

export function humanizeFeature(feature: string): string {
  const overrides: Record<string, string> = {
    number_inpatient: 'Prior inpatient visits',
    number_outpatient: 'Prior outpatient visits',
    number_emergency: 'Prior emergency visits',
    total_prior_visits: 'Total prior visits',
    discharge_disposition_id: 'Discharge disposition',
    admission_type_id: 'Admission type',
    admission_source_id: 'Admission source',
    diag_1_group: 'Primary diagnosis group',
    diag_2_group: 'Secondary diagnosis group',
    diag_3_group: 'Tertiary diagnosis group',
    time_in_hospital: 'Days in hospital',
    number_diagnoses: 'Number of diagnoses',
    num_medications: 'Number of medications',
    num_lab_procedures: 'Number of lab procedures',
    num_procedures: 'Number of procedures',
    num_med_changes: 'Medication dose changes',
    num_meds_active: 'Active medications',
    age_midpoint: 'Age',
    a1c_tested: 'HbA1c tested',
    insulin_changed: 'Insulin dose changed',
    a1cresult: 'HbA1c result',
    max_glu_serum: 'Glucose serum test',
    diabetesmed: 'Diabetes medication',
    change: 'Medication change',
  };
  if (overrides[feature]) return overrides[feature];
  const spaced = feature.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export interface ImportanceBar {
  feature: string;
  label: string;
  importance: number;
  summary: string;
  raisesRisk: boolean | null;
}

function summarizeDirection(entry: GlobalImportanceEntry): { summary: string; raisesRisk: boolean | null } {
  const direction = entry.direction;
  if (direction.kind === 'numeric') {
    if (direction.correlation_with_contribution === null) return { summary: 'No clear direction', raisesRisk: null };
    return { summary: direction.direction, raisesRisk: direction.correlation_with_contribution > 0 };
  }
  const top = direction.raises_risk_most[0];
  const bottom = direction.lowers_risk_most[0];
  const parts: string[] = [];
  if (top) parts.push(`raised most by: ${top.value}`);
  if (bottom) parts.push(`lowered most by: ${bottom.value}`);
  return { summary: parts.join('; ') || 'Categorical feature', raisesRisk: null };
}

export function topImportance(explanations: ReadmissionExplanations, count = 15): ImportanceBar[] {
  return explanations.global_importance.slice(0, count).map((entry) => {
    const { summary, raisesRisk } = summarizeDirection(entry);
    return {
      feature: entry.feature,
      label: humanizeFeature(entry.feature),
      importance: entry.mean_abs_contribution,
      summary,
      raisesRisk,
    };
  });
}

export interface FairnessRow {
  group: string;
  n: number;
  prevalence: number;
  rocAuc: number | null;
  rocAucCi: [number, number] | null;
  recall: number | null;
  falsePositiveRate: number | null;
  calibrationGap: number | null;
  suppressed: boolean;
  isRecallExtreme: boolean;
  isFprExtreme: boolean;
}

export function fairnessRows(attribute: FairnessAttribute): FairnessRow[] {
  const flaggedRecall = attribute.gaps.recall?.flagged ? attribute.gaps.recall : null;
  const flaggedFpr = attribute.gaps.false_positive_rate?.flagged ? attribute.gaps.false_positive_rate : null;
  return Object.entries(attribute.groups).map(([group, values]) => ({
    group,
    n: values.n,
    prevalence: values.prevalence,
    rocAuc: values.roc_auc ?? null,
    rocAucCi: values.roc_auc_ci95 ?? null,
    recall: values.recall ?? null,
    falsePositiveRate: values.false_positive_rate ?? null,
    calibrationGap: values.calibration_gap,
    suppressed: !values.sufficient_data,
    isRecallExtreme: !!flaggedRecall && (group === flaggedRecall.lowest_group || group === flaggedRecall.highest_group),
    isFprExtreme: !!flaggedFpr && (group === flaggedFpr.lowest_group || group === flaggedFpr.highest_group),
  }));
}

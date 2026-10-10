export interface ThresholdMetrics {
  threshold: number;
  precision: number;
  recall: number;
  specificity: number;
  f1: number;
  accuracy: number;
  flagged_fraction: number;
  /** [[tn, fp], [fn, tp]] */
  confusion_matrix: [[number, number], [number, number]];
}

export interface SplitSummary {
  rows: number;
  patients: number;
  positive_rate: number;
}

export interface ReadmissionMetrics {
  model_version: string;
  selected_model: string;
  trained_at_utc: string;
  training_source: string;
  target_definition: string;
  split_method: string;
  cohort: {
    total_rows: number;
    excluded_rows: { expired: number; hospice: number; total: number };
    in_scope_rows: number;
    train: SplitSummary;
    validation: SplitSummary;
    test: SplitSummary;
  };
  feature_list: string[];
  candidate_results: Record<
    string,
    { validation_roc_auc: number; validation_pr_auc: number; validation_brier_score: number }
  >;
  roc_auc: number;
  pr_auc: number;
  brier_score: number;
  prevalence: number;
  roc_auc_ci95: [number, number];
  pr_auc_ci95: [number, number];
  operating_threshold: number;
  thresholds: { max_f1: number; top_decile: number };
  threshold_analysis: {
    'default_0.5': ThresholdMetrics;
    max_f1: ThresholdMetrics;
    top_decile: ThresholdMetrics;
  };
  roc_curve: Array<{ fpr: number; tpr: number; threshold: number }>;
  pr_curve: Array<{ recall: number; precision: number; threshold: number }>;
  calibration_curve: Array<{ mean_predicted: number; observed_rate: number; count: number }>;
  literature_context: string;
  known_limitations: string[];
}

export interface GlobalImportanceEntry {
  feature: string;
  mean_abs_contribution: number;
  direction:
    | { kind: 'numeric'; correlation_with_contribution: number | null; direction: string }
    | {
        kind: 'categorical';
        raises_risk_most: Array<{ value: string; mean_contribution: number; count: number }>;
        lowers_risk_most: Array<{ value: string; mean_contribution: number; count: number }>;
      };
}

export interface ReadmissionExplanations {
  model_version: string;
  generated_at_utc: string;
  score_scale: string;
  method: string;
  global_sample: { rows: number; source: string };
  local_explanations: { encounters: number; top_features_per_encounter: number; table: string; selection: string };
  global_importance: GlobalImportanceEntry[];
}

export interface FairnessGroup {
  n: number;
  readmissions: number;
  prevalence: number;
  mean_predicted_risk: number | null;
  calibration_gap: number | null;
  sufficient_data: boolean;
  note?: string;
  roc_auc?: number;
  roc_auc_ci95?: [number, number];
  recall?: number;
  recall_ci95?: [number, number];
  false_positive_rate?: number;
  false_positive_rate_ci95?: [number, number];
  precision?: number | null;
  flagged_fraction?: number;
}

export interface FairnessGap {
  lowest_group: string;
  lowest_value: number;
  highest_group: string;
  highest_value: number;
  gap: number;
  flagged: boolean;
  intervals_overlap: boolean;
}

export interface FairnessAttribute {
  groups: Record<string, FairnessGroup>;
  gaps: { recall?: FairnessGap; false_positive_rate?: FairnessGap };
  interpretation: string;
  notes: string[];
}

export interface ReadmissionFairness {
  model_version: string;
  generated_at_utc: string;
  evaluated_on: string;
  operating_threshold: number;
  gap_review_threshold: number;
  suppression_rule: string;
  caveat: string;
  attributes: Record<'race' | 'gender' | 'age_band', FairnessAttribute>;
}

export interface CohortFlowStep {
  step: string;
  description: string;
  encounters: number;
  patients: number;
}

export interface ExposureRate {
  exposure: string;
  label: string;
  n: number;
  readmitted_within_30_days: number;
  rate: number;
  rate_ci95: [number, number];
}

export interface OddsRatioRow {
  term: string;
  is_exposure: boolean;
  odds_ratio: number;
  ci95: [number, number];
  p_value: number;
}

export interface Hba1cStudy {
  title: string;
  generated_at_utc: string;
  outcome: string;
  exposure_definitions: Record<string, string>;
  cohort_flow: CohortFlowStep[];
  group_rates: ExposureRate[];
  chi_square: { chi2: number; dof: number; p_value: number; cramers_v: number; n: number };
  adjusted_model: {
    reference_group: string;
    n: number;
    adjusted_for: string[];
    exposure_odds_ratios: OddsRatioRow[];
    covariate_odds_ratios: OddsRatioRow[];
  };
  interaction: {
    lr_statistic: number;
    df: number;
    p_value: number;
    'significant_at_0.05': boolean;
    interpretation: string;
  };
  stratified_rates_by_diagnosis: Array<{
    diag_group: string;
    exposure: string;
    n: number;
    readmitted_within_30_days: number;
    rate: number;
    rate_ci95: [number, number];
  }>;
  paper_comparison: {
    citation: string;
    headline_finding_of_paper: string;
    verify_against_paper: boolean;
    note: string;
    our_results: string;
    assessment: string;
    same_direction_as_paper: boolean;
  };
  limitations: string[];
}

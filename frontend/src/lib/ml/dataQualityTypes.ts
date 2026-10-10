export interface MissingnessRow {
  column: string;
  missing: number;
  missing_percent: number;
  not_performed: number;
  not_performed_percent: number;
  in_database: boolean;
  exclusion_reason?: string;
}

export interface DataQualityProfile {
  generated_at_utc: string;
  source: string;
  missingness: MissingnessRow[];
  excluded_columns: Record<string, string>;
  repeat_patients: {
    encounters: number;
    patients: number;
    patients_with_multiple_encounters: number;
    encounters_from_repeat_patients: number;
    max_encounters_for_one_patient: number;
    distribution: Record<string, number>;
    why_it_matters: string;
  };
  outcome_balance: { total: number; classes: Record<string, { count: number; percent: number }> };
  cohort_exclusions: {
    codes: Array<{ code: number; reason: string; description: string; count: number }>;
    total_excluded: number;
  };
  definitions: Array<{ term: string; definition: string; used_in: string }>;
  lineage: Array<{ id: string; label: string; detail: string }>;
  database_consistency: {
    raw_rows: number;
    database_rows: number;
    rows_match: boolean;
    raw_patients: number;
    database_patients: number;
    duplicate_encounter_ids_in_raw: number;
    source_columns_not_in_database: string[];
    database_columns_added_by_scoring: string[];
  };
}

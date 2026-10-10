import type { DataQualityProfile } from './dataQualityTypes';

export interface MissingnessBar {
  column: string;
  missingPercent: number;
  notPerformedPercent: number;
  inDatabase: boolean;
}

/** Only columns with something to report, worst first. */
export function missingnessBars(profile: DataQualityProfile): MissingnessBar[] {
  return profile.missingness
    .filter((row) => row.missing_percent > 0 || row.not_performed_percent > 0)
    .sort((a, b) => b.missing_percent + b.not_performed_percent - (a.missing_percent + a.not_performed_percent))
    .map((row) => ({
      column: row.column,
      missingPercent: row.missing_percent,
      notPerformedPercent: row.not_performed_percent,
      inDatabase: row.in_database,
    }));
}

export function repeatPatientBars(profile: DataQualityProfile): Array<{ label: string; patients: number }> {
  return Object.entries(profile.repeat_patients.distribution).map(([label, patients]) => ({
    label: label === '1' ? '1 encounter' : `${label} encounters`,
    patients,
  }));
}

export function outcomeBars(profile: DataQualityProfile): Array<{ label: string; count: number; percent: number }> {
  const names: Record<string, string> = { NO: 'Not readmitted', '<30': 'Within 30 days', '>30': 'After 30 days' };
  return Object.entries(profile.outcome_balance.classes).map(([key, value]) => ({
    label: names[key] ?? key,
    count: value.count,
    percent: value.percent,
  }));
}

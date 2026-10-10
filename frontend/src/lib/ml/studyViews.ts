import type { Hba1cStudy } from './studyArtifactTypes';

export function formatPValue(p: number): string {
  if (Number.isNaN(p)) return 'n/a';
  if (p < 0.001) return '< 0.001';
  return p.toFixed(3);
}

export interface ConsortBox {
  step: string;
  description: string;
  encounters: number;
  patients: number;
  removed: number;
}

export function consortBoxes(study: Hba1cStudy): ConsortBox[] {
  return study.cohort_flow.map((step, index) => ({
    ...step,
    removed: index === 0 ? 0 : study.cohort_flow[index - 1].encounters - step.encounters,
  }));
}

export interface ForestRow {
  key: string;
  label: string;
  odds: number;
  low: number;
  high: number;
  pValue: number | null;
  significant: boolean;
  isReference: boolean;
}

export function forestRows(study: Hba1cStudy): ForestRow[] {
  const reference = study.adjusted_model.reference_group;
  const rows: ForestRow[] = [
    {
      key: reference,
      label: `${study.exposure_definitions[reference] ?? reference} (reference)`,
      odds: 1, low: 1, high: 1, pValue: null, significant: false, isReference: true,
    },
  ];
  for (const row of study.adjusted_model.exposure_odds_ratios) {
    rows.push({
      key: row.term,
      label: study.exposure_definitions[row.term] ?? row.term,
      odds: row.odds_ratio,
      low: row.ci95[0],
      high: row.ci95[1],
      pValue: row.p_value,
      significant: row.p_value < 0.05,
      isReference: false,
    });
  }
  return rows;
}

const SHORT_EXPOSURE_LABELS: Record<string, string> = {
  not_measured: 'Not measured',
  normal: 'Normal',
  high_changed: '>8, changed',
  high_no_change: '>8, no change',
};

export function shortExposureLabel(exposure: string, fallback: string): string {
  return SHORT_EXPOSURE_LABELS[exposure] ?? fallback;
}

export interface RateBar {
  label: string;
  ratePercent: number;
  lowPercent: number;
  highPercent: number;
  n: number;
  /** recharts error-bar tuple: distances below and above the value */
  error: [number, number];
}

export function rateBars(study: Hba1cStudy): RateBar[] {
  return study.group_rates.map((row) => {
    const rate = row.rate * 100;
    const low = row.rate_ci95[0] * 100;
    const high = row.rate_ci95[1] * 100;
    return { label: shortExposureLabel(row.exposure, row.label), ratePercent: rate, lowPercent: low, highPercent: high, n: row.n, error: [rate - low, high - rate] };
  });
}

export interface StratifiedCell {
  rate: number;
  n: number;
}

export function stratifiedMatrix(study: Hba1cStudy): { diagnoses: string[]; exposures: string[]; cells: Record<string, StratifiedCell> } {
  const diagnoses = Array.from(new Set(study.stratified_rates_by_diagnosis.map((row) => row.diag_group)));
  const exposures = Object.keys(study.exposure_definitions);
  const cells: Record<string, StratifiedCell> = {};
  for (const row of study.stratified_rates_by_diagnosis) {
    cells[`${row.diag_group}|${row.exposure}`] = { rate: row.rate, n: row.n };
  }
  return { diagnoses, exposures, cells };
}

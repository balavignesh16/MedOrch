import { describe, expect, it } from 'vitest';
import { consortBoxes, forestRows, formatPValue, rateBars, stratifiedMatrix } from './studyViews';
import type { Hba1cStudy } from './studyArtifactTypes';

const study = {
  exposure_definitions: { not_measured: 'Not measured', normal: 'Normal', high_changed: 'High, changed' },
  cohort_flow: [
    { step: 'all', description: 'All', encounters: 100, patients: 80 },
    { step: 'excl', description: 'Excluded', encounters: 90, patients: 75 },
    { step: 'first', description: 'First', encounters: 75, patients: 75 },
  ],
  group_rates: [
    { exposure: 'not_measured', label: 'Not measured', n: 50, readmitted_within_30_days: 5, rate: 0.1, rate_ci95: [0.07, 0.14] },
  ],
  adjusted_model: {
    reference_group: 'not_measured',
    exposure_odds_ratios: [
      { term: 'normal', is_exposure: true, odds_ratio: 0.9, ci95: [0.8, 1.01], p_value: 0.07 },
      { term: 'high_changed', is_exposure: true, odds_ratio: 0.7, ci95: [0.6, 0.9], p_value: 0.004 },
    ],
  },
  stratified_rates_by_diagnosis: [
    { diag_group: 'Circulatory', exposure: 'normal', n: 40, readmitted_within_30_days: 4, rate: 0.1, rate_ci95: [0, 0] },
    { diag_group: 'Other', exposure: 'normal', n: 30, readmitted_within_30_days: 3, rate: 0.1, rate_ci95: [0, 0] },
  ],
} as unknown as Hba1cStudy;

describe('study views', () => {
  it('formats p-values without false precision', () => {
    expect(formatPValue(0.0004)).toBe('< 0.001');
    expect(formatPValue(0.0183)).toBe('0.018');
    expect(formatPValue(Number.NaN)).toBe('n/a');
  });

  it('derives CONSORT removals from consecutive steps', () => {
    expect(consortBoxes(study).map((box) => box.removed)).toEqual([0, 10, 15]);
  });

  it('builds a forest plot with the reference row at 1 and flags significance', () => {
    const rows = forestRows(study);
    expect(rows[0]).toMatchObject({ isReference: true, odds: 1, label: 'Not measured (reference)' });
    expect(rows.find((r) => r.label === 'Normal')?.significant).toBe(false);
    expect(rows.find((r) => r.label === 'High, changed')?.significant).toBe(true);
  });

  it('converts rate intervals to percentage error-bar distances', () => {
    const [bar] = rateBars(study);
    expect(bar.ratePercent).toBeCloseTo(10, 10);
    expect(bar.error[0]).toBeCloseTo(3, 10);
    expect(bar.error[1]).toBeCloseTo(4, 10);
  });

  it('pivots stratified rates by diagnosis and exposure', () => {
    const matrix = stratifiedMatrix(study);
    expect(matrix.diagnoses).toEqual(['Circulatory', 'Other']);
    expect(matrix.cells['Circulatory|normal']).toEqual({ rate: 0.1, n: 40 });
  });
});

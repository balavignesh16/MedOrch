import { describe, expect, it } from 'vitest';
import { missingnessBars, outcomeBars, repeatPatientBars } from './dataQualityViews';
import type { DataQualityProfile } from './dataQualityTypes';

const profile = {
  missingness: [
    { column: 'a', missing: 0, missing_percent: 0, not_performed: 0, not_performed_percent: 0, in_database: true },
    { column: 'weight', missing: 96, missing_percent: 96.86, not_performed: 0, not_performed_percent: 0, in_database: false },
    { column: 'A1Cresult', missing: 0, missing_percent: 0, not_performed: 83, not_performed_percent: 83.28, in_database: true },
    { column: 'race', missing: 2, missing_percent: 2.23, not_performed: 0, not_performed_percent: 0, in_database: true },
  ],
  repeat_patients: { distribution: { '1': 54745, '2': 10, '5+': 3 } },
  outcome_balance: { classes: { NO: { count: 3, percent: 50 }, '<30': { count: 1, percent: 25 }, '>30': { count: 2, percent: 25 } } },
} as unknown as DataQualityProfile;

describe('data quality views', () => {
  it('lists only columns with something to report, worst first, keeping not-performed separate from missing', () => {
    const bars = missingnessBars(profile);
    expect(bars.map((b) => b.column)).toEqual(['weight', 'A1Cresult', 'race']);
    expect(bars[0]).toMatchObject({ missingPercent: 96.86, inDatabase: false });
    expect(bars[1]).toMatchObject({ missingPercent: 0, notPerformedPercent: 83.28 });
  });

  it('labels repeat-patient and outcome buckets for humans', () => {
    expect(repeatPatientBars(profile).map((b) => b.label)).toEqual(['1 encounter', '2 encounters', '5+ encounters']);
    expect(outcomeBars(profile).map((b) => b.label)).toEqual(['Not readmitted', 'Within 30 days', 'After 30 days']);
  });
});

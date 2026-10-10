import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ComparisonError,
  interpretBinary,
  runCohortComparison,
  validateComparisonRequest,
  type BinaryComparison,
  type NumericComparison,
} from './cohortComparison';
import { chiSquare2x2 } from './inference';

let db: Database.Database;

// 200 Female (40 readmitted <30), 200 Male (20 readmitted <30); hospital days differ by gender.
function seed(): void {
  db.exec(`CREATE TABLE hospital_readmissions (
    encounter_id INTEGER, gender TEXT, age TEXT, race TEXT, readmitted TEXT,
    time_in_hospital INTEGER, num_medications INTEGER, number_inpatient INTEGER,
    admission_type_id TEXT, discharge_disposition_id TEXT, diag_1 TEXT)`);
  const insert = db.prepare('INSERT INTO hospital_readmissions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  let id = 1;
  for (const [gender, events, base] of [['Female', 40, 5], ['Male', 20, 3]] as const) {
    for (let i = 0; i < 200; i++) {
      insert.run(id++, gender, '[60-70)', 'Caucasian', i < events ? '<30' : 'NO', base + (i % 4), 10 + (i % 7), i % 3, '1', '1', '250');
    }
  }
}

beforeEach(() => {
  db = new Database(':memory:');
  seed();
});

afterEach(() => db.close());

describe('validateComparisonRequest', () => {
  it('accepts allowlisted filters and outcomes and drops unknown keys', () => {
    const result = validateComparisonRequest({
      cohortA: { gender: 'Female', sneaky: 'DROP TABLE x' },
      cohortB: { gender: 'Male' },
      outcome: 'readmitted_30',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.cohortA).toEqual({ gender: 'Female' });
      expect(result.value.outcome).toBe('readmitted_30');
    }
  });

  it('rejects unknown outcomes, non-object cohorts, and oversized values', () => {
    expect(validateComparisonRequest({ cohortA: {}, cohortB: {}, outcome: 'discharge_code' }).ok).toBe(false);
    expect(validateComparisonRequest({ cohortA: 'x', cohortB: {}, outcome: 'readmitted_30' }).ok).toBe(false);
    expect(validateComparisonRequest({ cohortA: { gender: 'x'.repeat(200) }, cohortB: {}, outcome: 'readmitted_30' }).ok).toBe(false);
    expect(validateComparisonRequest(null).ok).toBe(false);
    expect(validateComparisonRequest([]).ok).toBe(false);
  });
});

describe('binary outcome', () => {
  const run = () =>
    runCohortComparison(db, { cohortA: { gender: 'Female' }, cohortB: { gender: 'Male' }, outcome: 'readmitted_30' }) as BinaryComparison;

  it('computes counts, rates and the chi-square test from the real rows', () => {
    const result = run();
    expect(result.kind).toBe('binary');
    expect(result.a).toMatchObject({ n: 200, events: 40, rate: 0.2 });
    expect(result.b).toMatchObject({ n: 200, events: 20, rate: 0.1 });
    expect(result.difference.value).toBeCloseTo(0.1, 12);
    expect(result.test.name).toBe('chi-square');
    const expected = chiSquare2x2({ a: 40, b: 160, c: 20, d: 180 });
    expect(result.test.statistic).toBeCloseTo(expected.statistic, 10);
    expect(result.test.pValue).toBeCloseTo(expected.pValue, 12);
    expect(result.oddsRatio.value).toBeCloseTo((40 * 180) / (160 * 20), 10);
    expect(result.significant).toBe(true);
    expect(result.overlap.count).toBe(0);
  });

  it('describes significance and effect size separately, and always carries the causation caveat', () => {
    const result = run();
    expect(result.interpretation).toContain('statistically significant');
    expect(result.interpretation).toContain("Cohen's h");
    expect(result.caveats.join(' ')).toMatch(/not causation/);
    expect(result.caveats.join(' ')).toMatch(/not independent/);
  });

  it('switches to Fisher exact when an expected count is below 5', () => {
    const insert = db.prepare("INSERT INTO hospital_readmissions VALUES (?, 'Male', '[30-40)', ?, ?, 3, 8, 0, '1', '1', '250')");
    for (let i = 0; i < 6; i++) insert.run(8000 + i, 'Asian', i < 3 ? '<30' : 'NO');
    for (let i = 0; i < 6; i++) insert.run(8100 + i, 'Hispanic', 'NO');
    const result = runCohortComparison(db, {
      cohortA: { race: 'Asian' },
      cohortB: { race: 'Hispanic' },
      outcome: 'readmitted_30',
    }) as BinaryComparison;
    expect(result.test.name).toBe('fisher-exact');
    expect(result.test.statistic).toBeNull();
    expect(result.test.reason).toMatch(/below 5/);
    expect(result.test.pValue).toBeCloseTo(0.181818, 5);
    expect(result.oddsRatio.continuityAdjusted).toBe(true);
  });

  it('warns when a cohort is filtered on the outcome field itself', () => {
    const result = runCohortComparison(db, {
      cohortA: { gender: 'Female', readmitted: '<30' },
      cohortB: { gender: 'Male' },
      outcome: 'readmitted_30',
    });
    expect(result.warnings.join(' ')).toMatch(/degenerate/);
  });

  it('warns about overlapping cohorts and tiny cohorts', () => {
    const overlapping = runCohortComparison(db, {
      cohortA: { race: 'Caucasian' },
      cohortB: { gender: 'Female' },
      outcome: 'readmitted_30',
    });
    expect(overlapping.overlap.count).toBe(200);
    expect(overlapping.warnings.join(' ')).toMatch(/belong to both cohorts/);

    db.prepare("INSERT INTO hospital_readmissions VALUES (9001, 'Male', '[20-30)', 'Asian', 'NO', 2, 5, 0, '1', '1', '250')").run();
    const small = runCohortComparison(db, {
      cohortA: { race: 'Asian' },
      cohortB: { gender: 'Female' },
      outcome: 'readmitted_30',
    });
    expect(small.warnings.join(' ')).toMatch(/only 1 encounters/);
  });

  it('treats filter values as data, never as SQL', () => {
    expect(() =>
      runCohortComparison(db, {
        cohortA: { gender: "Female' OR '1'='1" },
        cohortB: { gender: 'Male' },
        outcome: 'readmitted_30',
      }),
    ).toThrow(ComparisonError);
  });

  it('refuses to compare against an empty cohort', () => {
    expect(() =>
      runCohortComparison(db, { cohortA: { race: 'Nobody' }, cohortB: { gender: 'Male' }, outcome: 'readmitted_30' }),
    ).toThrow(/matches no encounters/);
  });

  it('interpretation says "not significant" when it is not', () => {
    const base = run();
    const text = interpretBinary({ ...base, significant: false, test: { ...base.test, pValue: 0.4 }, effectSize: 'negligible' });
    expect(text).toContain('not statistically significant');
    expect(text).toContain('negligible');
  });
});

describe('numeric outcome', () => {
  it('computes descriptives, Welch and Mann-Whitney from the real rows', () => {
    const result = runCohortComparison(db, {
      cohortA: { gender: 'Female' },
      cohortB: { gender: 'Male' },
      outcome: 'time_in_hospital',
    }) as NumericComparison;
    expect(result.kind).toBe('numeric');
    expect(result.a.n).toBe(200);
    expect(result.a.mean).toBeCloseTo(6.5, 10);
    expect(result.b.mean).toBeCloseTo(4.5, 10);
    expect(result.welch.meanDifference).toBeCloseTo(2, 10);
    expect(result.welch.pValue).toBeLessThan(1e-10);
    expect(result.mannWhitney.pValue).toBeLessThan(1e-10);
    expect(result.effectSize).toBe('large');
    expect(result.interpretation).toContain("Welch's t-test");
    expect(result.interpretation).toContain('Mann–Whitney');
  });

  it('reports no difference for identical cohorts', () => {
    const result = runCohortComparison(db, {
      cohortA: { race: 'Caucasian' },
      cohortB: { race: 'Caucasian' },
      outcome: 'num_medications',
    }) as NumericComparison;
    expect(result.welch.meanDifference).toBe(0);
    expect(result.significant).toBe(false);
    expect(result.overlap.shareOfA).toBe(1);
  });
});

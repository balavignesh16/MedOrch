import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MEDICATION_COLUMNS, getMedicationAnalytics } from './medicationAnalytics';

let db: Database.Database;

function seed(rows: Array<{ insulin: string; metformin?: string; readmitted: string; extraChanges?: number }>): void {
  const columns = MEDICATION_COLUMNS.map((c) => `${c} TEXT`).join(', ');
  db.exec(`CREATE TABLE hospital_readmissions (encounter_id INTEGER, readmitted TEXT, ${columns})`);
  const placeholders = ['?', '?', ...MEDICATION_COLUMNS.map(() => '?')].join(', ');
  const insert = db.prepare(`INSERT INTO hospital_readmissions VALUES (${placeholders})`);
  rows.forEach((row, index) => {
    const values: Record<string, string> = Object.fromEntries(MEDICATION_COLUMNS.map((c) => [c, 'No']));
    values.insulin = row.insulin;
    if (row.metformin) values.metformin = row.metformin;
    let changes = 0;
    for (const column of MEDICATION_COLUMNS) {
      if (changes >= (row.extraChanges ?? 0)) break;
      if (column !== 'insulin' && column !== 'metformin') {
        values[column] = 'Up';
        changes++;
      }
    }
    insert.run(index + 1, row.readmitted, ...MEDICATION_COLUMNS.map((c) => values[c]));
  });
}

function repeat<T>(count: number, make: (i: number) => T): T[] {
  return Array.from({ length: count }, (_, i) => make(i));
}

beforeEach(() => {
  db = new Database(':memory:');
});
afterEach(() => db.close());

describe('getMedicationAnalytics', () => {
  it('computes prevalence from the real columns, sorted by how often a drug is prescribed', () => {
    seed([
      ...repeat(40, (i) => ({ insulin: 'Steady', metformin: i < 10 ? 'Up' : 'No', readmitted: 'NO' })),
      ...repeat(60, () => ({ insulin: 'No', readmitted: 'NO' })),
    ]);
    const result = getMedicationAnalytics(db);
    expect(result.totalEncounters).toBe(100);
    expect(result.prevalence[0].drug).toBe('insulin');
    expect(result.prevalence[0].prescribedPercent).toBeCloseTo(40, 10);
    const metformin = result.prevalence.find((p) => p.drug === 'metformin')!;
    expect(metformin).toMatchObject({ up: 10, steady: 0, down: 0 });
    expect(metformin.prescribedPercent).toBeCloseTo(10, 10);
  });

  it('reports 30-day readmission by insulin status with Wilson intervals, in a stable order', () => {
    seed([
      ...repeat(100, (i) => ({ insulin: 'No', readmitted: i < 10 ? '<30' : 'NO' })),
      ...repeat(100, (i) => ({ insulin: 'Up', readmitted: i < 20 ? '<30' : '>30' })),
      ...repeat(100, () => ({ insulin: 'Steady', readmitted: 'NO' })),
    ]);
    const { insulinReadmission } = getMedicationAnalytics(db);
    expect(insulinReadmission.map((r) => r.label)).toEqual(['No', 'Steady', 'Up']);
    const up = insulinReadmission[2];
    expect(up).toMatchObject({ n: 100, events: 20, rate: 0.2 });
    expect(up.ci95[0]).toBeLessThan(0.2);
    expect(up.ci95[1]).toBeGreaterThan(0.2);
  });

  it('suppresses categories smaller than the reporting minimum instead of showing false precision', () => {
    seed([
      ...repeat(100, () => ({ insulin: 'No', readmitted: 'NO' })),
      ...repeat(5, () => ({ insulin: 'Down', readmitted: '<30' })),
    ]);
    const result = getMedicationAnalytics(db);
    expect(result.insulinReadmission.map((r) => r.label)).toEqual(['No']);
    expect(result.suppressed).toContain('insulin = Down (n=5)');
  });

  it('buckets encounters by number of dose changes (insulin and metformin count too)', () => {
    seed([
      ...repeat(50, () => ({ insulin: 'No', readmitted: 'NO' })),
      ...repeat(40, () => ({ insulin: 'Up', readmitted: '<30' })),
      ...repeat(35, () => ({ insulin: 'Up', metformin: 'Down', readmitted: 'NO', extraChanges: 2 })),
    ]);
    const rows = getMedicationAnalytics(db).medicationChangeReadmission;
    expect(rows.map((r) => [r.label, r.n])).toEqual([['0 dose changes', 50], ['1 dose change', 40], ['3+ dose changes', 35]]);
    expect(rows[1].rate).toBe(1);
  });
});

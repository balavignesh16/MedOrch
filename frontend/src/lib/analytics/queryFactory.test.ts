import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeAnalyticsDatabase } from './cache';
import { QueryFactory } from './queryFactory';

let fixtureDirectory = '';

beforeEach(() => {
  fixtureDirectory = mkdtempSync(path.join(tmpdir(), 'medorch-analytics-'));
  const databasePath = path.join(fixtureDirectory, 'analytics.db');
  process.env.MEDORCH_DB_PATH = databasePath;

  const db = new Database(databasePath);
  db.exec(`
    CREATE TABLE hospital_readmissions (
      encounter_id INTEGER,
      gender TEXT,
      age TEXT,
      race TEXT,
      admission_type_id TEXT,
      discharge_disposition_id TEXT,
      readmitted TEXT,
      diag_1 TEXT,
      time_in_hospital INTEGER,
      num_medications INTEGER,
      number_emergency INTEGER,
      num_procedures INTEGER
    );
    INSERT INTO hospital_readmissions VALUES
      (1, 'Female', '[70-80)', 'Caucasian', '1', '1', '<30', '250', 6, 12, 1, 2),
      (2, 'Female', '[70-80)', 'Caucasian', '1', '1', 'NO', '250', 2, 5, 0, 1),
      (3, 'Male', '[50-60)', 'AfricanAmerican', '2', '1', '>30', '414', 4, 8, 0, 0);
  `);
  db.close();
});

afterEach(() => {
  closeAnalyticsDatabase();
  delete process.env.MEDORCH_DB_PATH;
  rmSync(fixtureDirectory, { recursive: true, force: true });
});

describe('QueryFactory with a deterministic SQLite fixture', () => {
  it('applies parameterized filters to counts', () => {
    expect(QueryFactory.executeCount('hospital_readmissions', { gender: 'Female' })).toBe(2);
    expect(QueryFactory.executeCount('hospital_readmissions', { gender: "Female' OR 1=1 --" })).toBe(0);
  });

  it('calculates stable aggregate values', () => {
    const result = QueryFactory.executeAggregation('hospital_readmissions', {});
    expect(result.count).toBe(3);
    expect(result.avg_time).toBe(4);
    expect(result.avg_meds).toBeCloseTo(25 / 3);
    expect(result.avg_er).toBeCloseTo(1 / 3);
    expect(result.avg_proc).toBe(1);
  });

  it('calculates the documented core metrics', () => {
    const result = QueryFactory.executeCoreMetrics('hospital_readmissions', {});
    expect(result).toMatchObject({
      totalEncounters: 3,
      readmissionNumerator: 1,
      readmissionDenominator: 3,
      avgLengthOfStay: 4,
    });
    expect(result.readmissionProxyRate).toBeCloseTo(100 / 3);
  });

  it('applies cohort filters but ignores the misleading readmission filter', () => {
    const result = QueryFactory.executeCoreMetrics('hospital_readmissions', {
      gender: 'Female',
      readmitted: 'NO',
    });
    expect(result).toEqual({
      totalEncounters: 2,
      readmissionNumerator: 1,
      readmissionDenominator: 2,
      readmissionProxyRate: 50,
      avgLengthOfStay: 4,
    });
  });

  it('returns safe empty metric values', () => {
    const db = new Database(process.env.MEDORCH_DB_PATH!);
    db.exec('DELETE FROM hospital_readmissions');
    db.close();
    expect(QueryFactory.executeCoreMetrics('hospital_readmissions', {})).toEqual({
      totalEncounters: 0,
      readmissionNumerator: 0,
      readmissionDenominator: 0,
      readmissionProxyRate: 0,
      avgLengthOfStay: null,
    });
  });

  it('excludes ambiguous duplicates and invalid values', () => {
    const db = new Database(process.env.MEDORCH_DB_PATH!);
    db.exec(`
      INSERT INTO hospital_readmissions VALUES
        (NULL, 'Female', '[70-80)', 'Caucasian', '1', '1', '<30', '250', 5, 1, 0, 0),
        (4, 'Male', '[50-60)', 'Caucasian', '1', '1', 'UNKNOWN', '250', NULL, 1, 0, 0),
        (5, 'Male', '[50-60)', 'Caucasian', '1', '1', 'NO', '250', 0, 1, 0, 0),
        (6, 'Male', '[50-60)', 'Caucasian', '1', '1', '<30', '250', 15, 1, 0, 0),
        (7, 'Male', '[50-60)', 'Caucasian', '1', '1', 'NO', '250', 3, 1, 0, 0),
        (7, 'Male', '[50-60)', 'Caucasian', '1', '1', 'NO', '250', 3, 1, 0, 0)
    `);
    db.close();
    expect(QueryFactory.executeCoreMetrics('hospital_readmissions', {})).toEqual({
      totalEncounters: 6,
      readmissionNumerator: 2,
      readmissionDenominator: 5,
      readmissionProxyRate: 40,
      avgLengthOfStay: 4,
    });
  });

  it('reports LOS as unavailable when no valid values remain', () => {
    const db = new Database(process.env.MEDORCH_DB_PATH!);
    db.exec(`
      DELETE FROM hospital_readmissions;
      INSERT INTO hospital_readmissions VALUES
        (10, 'Female', '[70-80)', 'Caucasian', '1', '1', 'NO', '250', NULL, 1, 0, 0),
        (11, 'Female', '[70-80)', 'Caucasian', '1', '1', '<30', '250', 0, 1, 0, 0),
        (12, 'Female', '[70-80)', 'Caucasian', '1', '1', '>30', '250', 15, 1, 0, 0)
    `);
    db.close();
    expect(QueryFactory.executeCoreMetrics('hospital_readmissions', {}).avgLengthOfStay).toBeNull();
  });

  it('groups only through an allowlisted column type', () => {
    const rows = QueryFactory.executeGroupedCount<{ category: string; count: number }>(
      'hospital_readmissions',
      'age',
      {},
    );
    expect(rows).toEqual([
      { category: '[70-80)', count: 2 },
      { category: '[50-60)', count: 1 },
    ]);
  });
});

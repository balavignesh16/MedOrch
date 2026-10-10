import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getHighRiskEncounters, getRiskSummary } from './predictiveData';

let db: Database.Database;

function seed(withExplanations = true): void {
  db.exec(`
    CREATE TABLE hospital_readmissions (
      encounter_id INTEGER, patient_nbr INTEGER, age TEXT, gender TEXT, race TEXT,
      time_in_hospital INTEGER, number_inpatient INTEGER, num_medications INTEGER, number_diagnoses INTEGER,
      readmitted TEXT, predicted_readmission_risk REAL, predicted_readmission_risk_model_version TEXT,
      predicted_readmission_risk_in_scope INTEGER
    );
  `);
  const insert = db.prepare(
    'INSERT INTO hospital_readmissions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const rows: Array<[number, number, string, string, string, number, number, number, number, string, number, string, number]> = [
    [900001, 700001, '[70-80)', 'Female', 'Caucasian', 5, 4, 14, 8, '<30', 0.62, 'v2', 1],
    [900002, 700002, '[60-70)', 'Male', 'AfricanAmerican', 3, 1, 9, 6, 'NO', 0.31, 'v2', 1],
    [900003, 700003, '[50-60)', 'Male', 'Asian', 2, 0, 5, 4, 'NO', 0.99, 'v2', 0],
    [900004, 700004, '[80-90)', 'Female', 'Caucasian', 7, 2, 12, 9, '>30', 0.12, 'v2', 1],
    [900005, 700005, '[40-50)', 'Male', 'Other', 1, 0, 3, 3, 'NO', 1.0, 'v2', 1],
  ];
  rows.forEach((row) => insert.run(...row));

  if (withExplanations) {
    db.exec(`CREATE TABLE readmission_risk_explanations (
      encounter_id INTEGER, rank INTEGER, feature TEXT, feature_value TEXT, contribution REAL, model_version TEXT)`);
    const explain = db.prepare('INSERT INTO readmission_risk_explanations VALUES (?, ?, ?, ?, ?, ?)');
    explain.run(900005, 1, 'number_inpatient', '5', 1.2, 'v2');
    explain.run(900005, 2, 'insulin', 'Down', 0.1, 'v2');
    explain.run(900001, 1, 'discharge_disposition_id', 'Rehab', 0.9, 'v2');
    explain.run(900002, 1, 'number_inpatient', '1', 0.2, 'OLD-MODEL');
  }
}

beforeEach(() => {
  db = new Database(':memory:');
});

afterEach(() => {
  db.close();
});

describe('getHighRiskEncounters', () => {
  it('returns in-scope encounters ordered by risk, excluding out-of-scope rows', () => {
    seed();
    const result = getHighRiskEncounters(db, 10);
    expect(result.map((r) => r.riskScore)).toEqual([1.0, 0.62, 0.31, 0.12]);
    expect(result.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    expect(result.some((r) => r.riskScore === 0.99)).toBe(false);
  });

  it('never exposes encounter_id or patient_nbr to the client', () => {
    seed();
    const serialized = JSON.stringify(getHighRiskEncounters(db, 10));
    expect(serialized).not.toMatch(/encounter_id|patient_nbr|encounterId|patientNbr/i);
    for (const forbidden of ['900001', '900005', '700001', '700005']) {
      expect(serialized).not.toContain(forbidden);
    }
    for (const row of getHighRiskEncounters(db, 10)) {
      expect(Object.keys(row).sort()).toEqual([
        'age', 'daysInHospital', 'diagnoses', 'drivers', 'gender', 'medications',
        'priorInpatientVisits', 'race', 'rank', 'riskScore',
      ]);
    }
  });

  it('attaches ordered explanation drivers and drops explanations from a different model version', () => {
    seed();
    const result = getHighRiskEncounters(db, 10);
    expect(result[0].drivers).toEqual([
      { feature: 'number_inpatient', value: '5', contribution: 1.2 },
      { feature: 'insulin', value: 'Down', contribution: 0.1 },
    ]);
    expect(result[1].drivers).toHaveLength(1);
    expect(result[2].drivers).toEqual([]);
  });

  it('still works when the explanations table does not exist', () => {
    seed(false);
    const result = getHighRiskEncounters(db, 2);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.drivers.length === 0)).toBe(true);
  });

  it('returns an empty list when the model has not scored the table yet', () => {
    db.exec('CREATE TABLE hospital_readmissions (encounter_id INTEGER, age TEXT)');
    expect(getHighRiskEncounters(db)).toEqual([]);
  });

  it('bounds the requested limit', () => {
    seed();
    expect(getHighRiskEncounters(db, 0)).toHaveLength(1);
    expect(getHighRiskEncounters(db, 9999)).toHaveLength(4);
  });
});

describe('getRiskSummary', () => {
  it('summarises only in-scope scored encounters and bins risk into 5% buckets', () => {
    seed();
    const summary = getRiskSummary(db);
    expect(summary.scoredEncounters).toBe(4);
    expect(summary.meanPredictedRisk).toBeCloseTo((0.62 + 0.31 + 0.12 + 1.0) / 4, 6);
    expect(summary.observedWithin30DayRate).toBeCloseTo(0.25, 6);
    const total = summary.bins.reduce((sum, bin) => sum + bin.count, 0);
    expect(total).toBe(4);
    const last = summary.bins[summary.bins.length - 1];
    expect(last.to).toBe(1);
    expect(last.count).toBe(1);
    expect(summary.bins.every((bin) => Math.abs(bin.to - bin.from - 0.05) < 1e-9)).toBe(true);
  });

  it('is empty and safe before scoring', () => {
    db.exec('CREATE TABLE hospital_readmissions (encounter_id INTEGER)');
    expect(getRiskSummary(db)).toEqual({
      scoredEncounters: 0, meanPredictedRisk: null, observedWithin30DayRate: null, bins: [],
    });
  });
});

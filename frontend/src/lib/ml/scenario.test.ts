import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { computeScenario, scenarioMath, validateScenarioInput } from './scenario';

const baseInput = { capacityPercent: 10, assumedReductionPercent: 0, costPerReadmission: null, costPerIntervention: null };

describe('scenarioMath', () => {
  const counts = { scoredEncounters: 1000, targeted: 100, caughtReadmissions: 25, totalReadmissions: 110 };

  it('derives capture rate, precision, prevalence and lift from the counts', () => {
    const result = scenarioMath(counts, baseInput);
    expect(result.prevalence).toBeCloseTo(0.11, 12);
    expect(result.captureRate).toBeCloseTo(25 / 110, 12);
    expect(result.precisionAtCapacity).toBeCloseTo(0.25, 12);
    expect(result.lift).toBeCloseTo(25 / 110 / 0.1, 12);
  });

  it('claims no benefit unless the user enters an assumed reduction', () => {
    const result = scenarioMath(counts, baseInput);
    expect(result.scenarioAverted).toBe(0);
    expect(result.scenarioSavings).toBeNull();
    expect(result.interventionCost).toBeNull();
    expect(result.scenarioNet).toBeNull();
  });

  it('scales averted readmissions by the assumed reduction', () => {
    expect(scenarioMath(counts, { ...baseInput, assumedReductionPercent: 20 }).scenarioAverted).toBeCloseTo(5, 12);
  });

  it('shows money only for the costs the user entered', () => {
    const onlyIntervention = scenarioMath(counts, { ...baseInput, assumedReductionPercent: 20, costPerIntervention: 200 });
    expect(onlyIntervention.interventionCost).toBe(20000);
    expect(onlyIntervention.scenarioSavings).toBeNull();
    expect(onlyIntervention.scenarioNet).toBeNull();

    const both = scenarioMath(counts, { ...baseInput, assumedReductionPercent: 20, costPerIntervention: 200, costPerReadmission: 15000 });
    expect(both.scenarioSavings).toBeCloseTo(75000, 8);
    expect(both.scenarioNet).toBeCloseTo(55000, 8);
  });

  it('always labels itself as a scenario and shows its formula and assumptions', () => {
    const result = scenarioMath(counts, baseInput);
    expect(result.label).toMatch(/not a forecast/);
    expect(result.formula.length).toBeGreaterThan(3);
    expect(result.assumptions.join(' ')).toMatch(/optimistic/);
  });

  it('is safe with empty data', () => {
    const result = scenarioMath({ scoredEncounters: 0, targeted: 0, caughtReadmissions: 0, totalReadmissions: 0 }, baseInput);
    expect(result.lift).toBe(0);
    expect(result.captureRate).toBe(0);
  });
});

describe('validateScenarioInput', () => {
  it('requires capacity within 1-50 and defaults the reduction to zero', () => {
    const ok = validateScenarioInput({ capacityPercent: 10 });
    expect(ok).toEqual({ ok: true, value: { capacityPercent: 10, assumedReductionPercent: 0, costPerReadmission: null, costPerIntervention: null } });
    expect(validateScenarioInput({ capacityPercent: 0 }).ok).toBe(false);
    expect(validateScenarioInput({ capacityPercent: 51 }).ok).toBe(false);
    expect(validateScenarioInput({}).ok).toBe(false);
    expect(validateScenarioInput({ capacityPercent: 'abc' }).ok).toBe(false);
  });

  it('bounds the reduction and the costs, and treats blank costs as not entered', () => {
    expect(validateScenarioInput({ capacityPercent: 10, assumedReductionPercent: 101 }).ok).toBe(false);
    expect(validateScenarioInput({ capacityPercent: 10, assumedReductionPercent: -1 }).ok).toBe(false);
    expect(validateScenarioInput({ capacityPercent: 10, costPerIntervention: -5 }).ok).toBe(false);
    const blank = validateScenarioInput({ capacityPercent: 10, costPerReadmission: '', costPerIntervention: null });
    expect(blank.ok && blank.value.costPerReadmission).toBeNull();
    expect(validateScenarioInput(null).ok).toBe(false);
  });
});

describe('computeScenario against a database', () => {
  let db: Database.Database;
  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`CREATE TABLE hospital_readmissions (encounter_id INTEGER, readmitted TEXT,
      predicted_readmission_risk REAL, predicted_readmission_risk_in_scope INTEGER)`);
    const insert = db.prepare('INSERT INTO hospital_readmissions VALUES (?, ?, ?, ?)');
    // 20 in-scope encounters; risk descends with id; the 4 highest-risk include 2 readmissions; 1 more further down.
    for (let i = 1; i <= 20; i++) {
      insert.run(i, [1, 3, 15].includes(i) ? '<30' : 'NO', 1 - i / 100, 1);
    }
    insert.run(100, '<30', 0.999, 0); // out of scope: must be ignored even though its risk is highest
  });
  afterEach(() => db.close());

  it('counts real readmissions among the top-risk slice and ignores out-of-scope rows', () => {
    const result = computeScenario(db, { ...baseInput, capacityPercent: 20 });
    expect(result.scoredEncounters).toBe(20);
    expect(result.targeted).toBe(4);
    expect(result.caughtReadmissions).toBe(2);
    expect(result.totalReadmissions).toBe(3);
    expect(result.captureRate).toBeCloseTo(2 / 3, 12);
  });

  it('follows up no one when the slice rounds down to zero', () => {
    db.exec('DELETE FROM hospital_readmissions WHERE encounter_id > 5');
    const result = computeScenario(db, { ...baseInput, capacityPercent: 1 });
    expect(result.targeted).toBe(0);
    expect(result.caughtReadmissions).toBe(0);
  });
});

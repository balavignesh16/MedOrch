import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import {
  buildExecutiveFindings,
  dataQualityFindings,
  driversFinding,
  evaluateTarget,
  fairnessFindings,
  getHeadlineKpis,
  modelFinding,
  studyFinding,
} from './executiveSummary';
import type { DataQualityProfile } from './ml/dataQualityTypes';
import type { ReadmissionExplanations, ReadmissionFairness, ReadmissionMetrics } from './ml/modelArtifactTypes';
import type { Hba1cStudy } from './ml/studyArtifactTypes';

const metrics = {
  roc_auc: 0.6694,
  roc_auc_ci95: [0.6573, 0.6815],
  threshold_analysis: { max_f1: { recall: 0.4377, precision: 0.2105, flagged_fraction: 0.2328 } },
} as unknown as ReadmissionMetrics;

const study = (pValues: number[], interactionSignificant: boolean) =>
  ({
    adjusted_model: {
      exposure_odds_ratios: pValues.map((p, i) => ({ term: `g${i}`, odds_ratio: 0.9 - i * 0.05, ci95: [0.7, 1.1], p_value: p })),
    },
    interaction: { 'significant_at_0.05': interactionSignificant, p_value: 0.0068 },
    paper_comparison: { assessment: 'Directionally consistent with the paper.' },
  }) as unknown as Hba1cStudy;

const fairness = (flagged: boolean, overlap: boolean) =>
  ({
    gap_review_threshold: 0.1,
    attributes: {
      race: {
        gaps: {
          recall: { lowest_group: 'Unknown', lowest_value: 0.21, highest_group: 'Asian', highest_value: 0.6, flagged, intervals_overlap: overlap, gap: 0.39 },
        },
      },
      gender: { gaps: {} },
    },
  }) as unknown as ReadmissionFairness;

describe('headline KPIs', () => {
  it('computes encounters, patients, both readmission rates, LOS and HbA1c testing share from the rows', () => {
    const db = new Database(':memory:');
    db.exec('CREATE TABLE hospital_readmissions (patient_nbr INTEGER, time_in_hospital INTEGER, readmitted TEXT, a1cresult TEXT)');
    const insert = db.prepare('INSERT INTO hospital_readmissions VALUES (?, ?, ?, ?)');
    [[1, 2, '<30', null], [1, 4, '>30', '>8'], [2, 6, 'NO', 'Norm'], [3, 8, 'NO', null]].forEach((row) => insert.run(...row));
    const kpis = getHeadlineKpis(db);
    expect(kpis).toMatchObject({ encounters: 4, patients: 3, thirtyDayRate: 0.25, anyReadmissionRate: 0.5, meanLos: 5, hba1cTestedShare: 0.5 });
    db.close();
  });
});

describe('finding rules', () => {
  it('states model performance with its interval and the demonstration caveat', () => {
    const text = modelFinding(metrics).text;
    expect(text).toContain('0.669');
    expect(text).toContain('0.657–0.681');
    expect(text).toContain('catches 43.8%');
    expect(text).toContain('demonstration, not a clinical tool');
  });

  it('reports how many HbA1c groups are individually significant, and never overstates', () => {
    const none = studyFinding(study([0.4, 0.11, 0.05], false)).text;
    expect(none).toContain('0 of 3 measured groups are individually significant');
    expect(none).toContain('No significant difference by primary diagnosis');
    const some = studyFinding(study([0.01, 0.2, 0.3], true)).text;
    expect(some).toContain('1 of 3 measured groups');
    expect(some).toContain('differs by primary diagnosis (p 0.007)');
  });

  it('flags fairness gaps and says when they may be sampling noise', () => {
    const overlapping = fairnessFindings(fairness(true, true));
    expect(overlapping).toHaveLength(1);
    expect(overlapping[0].text).toContain('By race, recall ranges from 0.21 (Unknown) to 0.60 (Asian)');
    expect(overlapping[0].text).toContain('may be sampling noise');
    expect(fairnessFindings(fairness(true, false))[0].text).toContain('intervals do not overlap');
    expect(fairnessFindings(fairness(false, true))[0].text).toBe('No subgroup gap exceeded the review threshold.');
  });

  it('names the top three drivers without implying causation', () => {
    const explanations = {
      global_importance: [{ feature: 'number_inpatient' }, { feature: 'discharge_disposition_id' }, { feature: 'total_prior_visits' }, { feature: 'x' }],
    } as unknown as ReadmissionExplanations;
    const text = driversFinding(explanations).text;
    expect(text).toContain('Prior inpatient visits, Discharge disposition, Total prior visits');
    expect(text).toContain('not causes');
  });

  it('summarises the worst missingness and repeat patients from the profile', () => {
    const quality = {
      missingness: [
        { column: 'weight', missing_percent: 96.86, not_performed_percent: 0, in_database: false },
        { column: 'max_glu_serum', missing_percent: 0, not_performed_percent: 94.75, in_database: true },
        { column: 'A1Cresult', missing_percent: 0, not_performed_percent: 83.28, in_database: true },
        { column: 'race', missing_percent: 2.23, not_performed_percent: 0, in_database: true },
      ],
      repeat_patients: { patients: 71518, patients_with_multiple_encounters: 16773 },
    } as unknown as DataQualityProfile;
    const texts = dataQualityFindings(quality).map((f) => f.text);
    expect(texts[0]).toBe('weight is missing for 96.9% of encounters and was excluded from the database.');
    expect(texts[1]).toBe('max_glu_serum was not performed for 94.8% of encounters, so results that depend on it describe only the tested minority.');
    expect(texts[2]).toBe('A1Cresult was not performed for 83.3% of encounters, which limits any HbA1c analysis.');
    expect(texts[3]).toContain('16,773 of 71,518 patients');
  });

  it('assembles whatever is available and skips what is missing', () => {
    const none = buildExecutiveFindings({ metrics: null, study: null, fairness: null, explanations: null, quality: null, operationsFindings: [] });
    expect(none).toEqual([]);
    const some = buildExecutiveFindings({ metrics, study: null, fairness: null, explanations: null, quality: null, operationsFindings: ['a', 'b', 'c', 'd'] });
    expect(some.map((f) => f.source)).toEqual(['Model', 'Operations', 'Operations', 'Operations']);
  });

  it('contains no invented ROI, benchmark, or confidence language', () => {
    const all = buildExecutiveFindings({
      metrics, study: study([0.4, 0.2, 0.3], false), fairness: fairness(true, true), explanations: null, quality: null, operationsFindings: [],
    })
      .map((f) => f.text)
      .join(' ');
    expect(all).not.toMatch(/ROI|benchmark|industry|best practice|confidence:/i);
  });
});

describe('evaluateTarget', () => {
  it('has no verdict until the user enters a target', () => {
    expect(evaluateTarget(0.112, '', 'lower-is-better')).toEqual({ status: 'no-target', gap: null });
    expect(evaluateTarget(0.112, 'abc', 'lower-is-better').status).toBe('no-target');
  });

  it('compares in the right direction and reports the signed gap', () => {
    const lower = evaluateTarget(0.112, '0.1', 'lower-is-better');
    expect(lower.status).toBe('misses');
    expect(lower.gap).toBeCloseTo(0.012, 12);
    expect(evaluateTarget(0.09, '0.1', 'lower-is-better').status).toBe('meets');
    expect(evaluateTarget(0.5, '0.4', 'higher-is-better').status).toBe('meets');
    expect(evaluateTarget(0.3, '0.4', 'higher-is-better').status).toBe('misses');
    expect(evaluateTarget(0.1, '0.1', 'lower-is-better').status).toBe('meets');
  });
});

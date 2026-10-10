import { describe, expect, it } from 'vitest';
import {
  buildCalibrationSeries,
  buildPrSeries,
  buildRocSeries,
  confusionCells,
  fairnessRows,
  formatDecimal,
  formatInterval,
  formatPercent,
  humanizeFeature,
  thresholdOptions,
  topImportance,
} from './modelArtifactViews';
import type {
  FairnessAttribute,
  ReadmissionExplanations,
  ReadmissionMetrics,
  ThresholdMetrics,
} from './modelArtifactTypes';

const threshold = (value: number, tp: number): ThresholdMetrics => ({
  threshold: value, precision: 0.2, recall: 0.4, specificity: 0.8, f1: 0.27, accuracy: 0.75,
  flagged_fraction: 0.2, confusion_matrix: [[70, 10], [10, tp]],
});

const metrics = {
  threshold_analysis: { 'default_0.5': threshold(0.5, 1), max_f1: threshold(0.14, 5), top_decile: threshold(0.17, 3) },
  roc_curve: [{ fpr: 0, tpr: 0, threshold: 1 }, { fpr: 1, tpr: 1, threshold: 0 }],
  pr_curve: [{ recall: 0.1, precision: 0.5, threshold: 0.9 }],
  calibration_curve: [{ mean_predicted: 0.1, observed_rate: 0.12, count: 50 }],
} as unknown as ReadmissionMetrics;

describe('formatters', () => {
  it('formats percentages, decimals and intervals, tolerating missing values', () => {
    expect(formatPercent(0.4377)).toBe('43.8%');
    expect(formatPercent(null)).toBe('n/a');
    expect(formatPercent(Number.NaN)).toBe('n/a');
    expect(formatDecimal(0.66941)).toBe('0.669');
    expect(formatInterval([0.6573, 0.6816])).toBe('0.657 – 0.682');
    expect(formatInterval(undefined)).toBe('n/a');
  });
});

describe('threshold explorer data', () => {
  it('exposes all three operating points in a stable order', () => {
    const options = thresholdOptions(metrics);
    expect(options.map((o) => o.key)).toEqual(['default_0.5', 'max_f1', 'top_decile']);
    expect(options[1].metrics.threshold).toBe(0.14);
  });

  it('reads confusion-matrix cells in [[tn, fp], [fn, tp]] order', () => {
    expect(confusionCells(threshold(0.1, 5))).toEqual({ tn: 70, fp: 10, fn: 10, tp: 5 });
  });
});

describe('chart series', () => {
  it('maps curve artifacts to plain chart points without recomputing anything', () => {
    expect(buildRocSeries(metrics)).toEqual([{ fpr: 0, tpr: 0 }, { fpr: 1, tpr: 1 }]);
    expect(buildPrSeries(metrics)).toEqual([{ recall: 0.1, precision: 0.5 }]);
    expect(buildCalibrationSeries(metrics)).toEqual([{ predicted: 0.1, observed: 0.12, count: 50 }]);
  });
});

describe('feature importance view', () => {
  const explanations = {
    global_importance: [
      { feature: 'number_inpatient', mean_abs_contribution: 0.23,
        direction: { kind: 'numeric', correlation_with_contribution: 0.95, direction: 'higher values raise risk' } },
      { feature: 'discharge_disposition_id', mean_abs_contribution: 0.21,
        direction: { kind: 'categorical',
          raises_risk_most: [{ value: 'Rehab', mean_contribution: 1.1, count: 50 }],
          lowers_risk_most: [{ value: 'Home', mean_contribution: -0.16, count: 900 }] } },
      { feature: 'x', mean_abs_contribution: 0.01,
        direction: { kind: 'numeric', correlation_with_contribution: null, direction: 'no clear direction' } },
    ],
  } as unknown as ReadmissionExplanations;

  it('humanizes feature names and summarises direction deterministically', () => {
    const bars = topImportance(explanations, 2);
    expect(bars).toHaveLength(2);
    expect(bars[0]).toMatchObject({ label: 'Prior inpatient visits', raisesRisk: true });
    expect(bars[1].summary).toBe('raised most by: Rehab; lowered most by: Home');
    expect(bars[1].raisesRisk).toBeNull();
  });

  it('keeps unknown features readable', () => {
    expect(humanizeFeature('glyburide_metformin')).toBe('Glyburide metformin');
    expect(topImportance(explanations, 3)[2].raisesRisk).toBeNull();
  });
});

describe('fairness rows', () => {
  const attribute = {
    groups: {
      A: { n: 1000, readmissions: 100, prevalence: 0.1, mean_predicted_risk: 0.11, calibration_gap: 0.01,
        sufficient_data: true, roc_auc: 0.66, roc_auc_ci95: [0.63, 0.69], recall: 0.3, false_positive_rate: 0.2 },
      B: { n: 1000, readmissions: 120, prevalence: 0.12, mean_predicted_risk: 0.12, calibration_gap: 0,
        sufficient_data: true, roc_auc: 0.7, roc_auc_ci95: [0.67, 0.73], recall: 0.5, false_positive_rate: 0.21 },
      tiny: { n: 20, readmissions: 1, prevalence: 0.05, mean_predicted_risk: 0.1, calibration_gap: 0.05, sufficient_data: false },
    },
    gaps: {
      recall: { lowest_group: 'A', lowest_value: 0.3, highest_group: 'B', highest_value: 0.5, gap: 0.2, flagged: true, intervals_overlap: false },
      false_positive_rate: { lowest_group: 'A', lowest_value: 0.2, highest_group: 'B', highest_value: 0.21, gap: 0.01, flagged: false, intervals_overlap: true },
    },
    interpretation: '', notes: [],
  } as unknown as FairnessAttribute;

  it('marks flagged extremes and suppresses small groups', () => {
    const rows = fairnessRows(attribute);
    const byGroup = Object.fromEntries(rows.map((r) => [r.group, r]));
    expect(byGroup.A.isRecallExtreme && byGroup.B.isRecallExtreme).toBe(true);
    expect(byGroup.A.isFprExtreme).toBe(false);
    expect(byGroup.tiny.suppressed).toBe(true);
    expect(byGroup.tiny.rocAuc).toBeNull();
    expect(byGroup.tiny.recall).toBeNull();
  });
});

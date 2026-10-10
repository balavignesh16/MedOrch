import { describe, expect, it } from 'vitest';
import {
  chiSquare2x2,
  chiSquareSurvival,
  cohensD,
  cohensH,
  differenceOfProportionsCi,
  effectSizeLabel,
  fisherExact2x2,
  mannWhitneyU,
  normalSurvival,
  normalTwoSidedP,
  oddsRatio,
  studentTCritical,
  studentTTwoSidedP,
  welchTTest,
  wilsonInterval,
} from './inference';

// Expected values below were computed with scipy 1.17 (scipy.stats.chi2.sf, norm.sf, t.sf, t.ppf,
// ttest_ind(equal_var=False), mannwhitneyu(method='asymptotic'), fisher_exact, chi2_contingency(correction=False)).

const relative = (actual: number, expected: number, tolerance = 1e-6) =>
  expect(Math.abs(actual - expected) / Math.max(Math.abs(expected), 1e-12)).toBeLessThan(tolerance);

describe('distribution functions match scipy', () => {
  it('chi-square survival function', () => {
    relative(chiSquareSurvival(3.84, 1), 0.05004352124870519);
    relative(chiSquareSurvival(10.5, 4), 0.03279698999488366);
    relative(chiSquareSurvival(150, 120), 0.03307348091130466);
    relative(chiSquareSurvival(0.5, 3), 0.9188914116546758);
    relative(chiSquareSurvival(25, 1), 5.733031437583874e-7);
    expect(chiSquareSurvival(0, 2)).toBe(1);
  });

  it('normal survival and two-sided p', () => {
    relative(normalTwoSidedP(1.96), 0.04999579029644087);
    relative(normalTwoSidedP(0.5), 0.6170750774519738);
    relative(normalTwoSidedP(3.1), 0.0019352064264367126);
    expect(normalTwoSidedP(0)).toBeCloseTo(1, 12);
    relative(normalSurvival(-1.2), 0.8849303297782918);
    relative(normalSurvival(0.7), 0.24196365222307303);
    relative(normalSurvival(2.5), 0.006209665325776132);
  });

  it('Student t two-sided p, including fractional and very large df', () => {
    relative(studentTTwoSidedP(2.0, 10), 0.07338803477074039);
    relative(studentTTwoSidedP(1.5, 3), 0.23058386524482294);
    relative(studentTTwoSidedP(2.2, 37.4), 0.03406087396091698);
    relative(studentTTwoSidedP(-1.1, 120.5), 0.27352481426229647);
    relative(studentTTwoSidedP(0.4, 50000), 0.689158225547933, 1e-5);
  });

  it('Student t critical value (95%)', () => {
    relative(studentTCritical(3), 3.1824463052837078, 1e-9);
    relative(studentTCritical(10), 2.2281388519862744, 1e-9);
    relative(studentTCritical(37.4), 2.0254612332283064, 1e-9);
    relative(studentTCritical(500), 1.9647198374673676, 1e-9);
  });
});

const X = [2, 3, 3, 4, 5, 5, 5, 6, 7, 9, 12, 3, 4, 8];
const Y = [1, 2, 2, 3, 3, 4, 4, 4, 5, 6, 2, 3, 7, 1, 2, 3];

describe('two-sample tests match scipy', () => {
  it("Welch's t-test with confidence interval and Cohen's d", () => {
    const result = welchTTest(X, Y);
    relative(result.t, 2.5577602290751145);
    relative(result.pValue, 0.01834348829120866);
    relative(result.degreesOfFreedom, 20.97036297592785);
    relative(result.ci95[0], 0.4071085830817771, 1e-6);
    relative(result.ci95[1], 3.9500342740610805, 1e-6);
    relative(cohensD(X, Y), 0.965944691709793);
  });

  it('Mann-Whitney U with ties and continuity correction', () => {
    const result = mannWhitneyU(X, Y);
    expect(result.u).toBeCloseTo(169.5, 9);
    relative(result.pValue, 0.01644961151834768, 1e-6);
  });

  it('Fisher exact test (two-sided)', () => {
    relative(fisherExact2x2({ a: 3, b: 1, c: 1, d: 3 }), 0.48571428571428565);
    relative(fisherExact2x2({ a: 8, b: 2, c: 1, d: 5 }), 0.034965034965034975);
    relative(fisherExact2x2({ a: 0, b: 10, c: 6, d: 4 }), 0.010835913312693497);
  });

  it('Pearson chi-square on 2x2 tables', () => {
    for (const [table, chi2, p] of [
      [{ a: 30, b: 70, c: 20, d: 80 }, 2.6666666666666665, 0.10247043485974942],
      [{ a: 1200, b: 8800, c: 1000, d: 9000 }, 20.42900919305414, 6.188458781738713e-6],
      [{ a: 10, b: 90, c: 30, d: 70 }, 12.5, 0.00040695201744495946],
    ] as const) {
      const result = chiSquare2x2(table);
      relative(result.statistic, chi2);
      relative(result.pValue, p, 1e-5);
    }
  });
});

describe('effect sizes and intervals', () => {
  it('odds ratio with Woolf interval matches the closed form', () => {
    const result = oddsRatio({ a: 30, b: 70, c: 20, d: 80 });
    expect(result.value).toBeCloseTo((30 * 80) / (70 * 20), 12);
    const se = Math.sqrt(1 / 30 + 1 / 70 + 1 / 20 + 1 / 80);
    expect(result.ci95[0]).toBeCloseTo(Math.exp(Math.log(result.value) - 1.959963984540054 * se), 10);
    expect(result.ci95[1]).toBeCloseTo(Math.exp(Math.log(result.value) + 1.959963984540054 * se), 10);
    expect(result.continuityAdjusted).toBe(false);
  });

  it('adds 0.5 to every cell only when a cell is zero, and says so', () => {
    const result = oddsRatio({ a: 0, b: 10, c: 5, d: 5 });
    expect(result.continuityAdjusted).toBe(true);
    expect(result.value).toBeCloseTo((0.5 * 5.5) / (10.5 * 5.5), 12);
    expect(Number.isFinite(result.ci95[1])).toBe(true);
  });

  it("Cohen's h and the conventional effect-size labels", () => {
    expect(cohensH(0.5, 0.5)).toBe(0);
    expect(cohensH(0.2, 0.1)).toBeCloseTo(2 * Math.asin(Math.sqrt(0.2)) - 2 * Math.asin(Math.sqrt(0.1)), 12);
    expect(effectSizeLabel(0.05)).toBe('negligible');
    expect(effectSizeLabel(-0.3)).toBe('small');
    expect(effectSizeLabel(0.5)).toBe('medium');
    expect(effectSizeLabel(-1.1)).toBe('large');
  });

  it('Wilson interval matches the reference used by the Python engine', () => {
    const [low, high] = wilsonInterval(10, 20);
    expect(low).toBeCloseTo(0.2993, 3);
    expect(high).toBeCloseTo(0.7007, 3);
    expect(wilsonInterval(0, 0)).toEqual([0, 0]);
  });

  it('difference of proportions interval is centred on the difference', () => {
    const { difference, ci95 } = differenceOfProportionsCi(30, 100, 20, 100);
    expect(difference).toBeCloseTo(0.1, 12);
    expect((ci95[0] + ci95[1]) / 2).toBeCloseTo(0.1, 12);
    expect(ci95[0]).toBeLessThan(0.1);
  });
});

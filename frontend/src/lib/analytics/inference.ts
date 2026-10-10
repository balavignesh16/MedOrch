/** Classical inference helpers (no dependencies). Every function is validated
 * against scipy reference values in inference.test.ts. */

const EPS = 1e-15;
const FPMIN = 1e-300;
const MAX_ITERATIONS = 2000;

const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
  1.5056327351493116e-7,
];

export function logGamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  const z = x - 1;
  let sum = LANCZOS[0];
  for (let i = 1; i < LANCZOS.length; i++) sum += LANCZOS[i] / (z + i);
  const t = z + LANCZOS.length - 1.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum);
}

function gammaSeries(a: number, x: number): number {
  let ap = a;
  let del = 1 / a;
  let sum = del;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPS) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

function gammaContinuedFraction(a: number, x: number): number {
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < MAX_ITERATIONS; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < EPS) break;
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

/** Regularized upper incomplete gamma Q(a, x). */
export function regularizedGammaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  if (x < a + 1) return 1 - gammaSeries(a, x);
  return gammaContinuedFraction(a, x);
}

export function chiSquareSurvival(statistic: number, degreesOfFreedom: number): number {
  if (statistic <= 0) return 1;
  return regularizedGammaQ(degreesOfFreedom / 2, statistic / 2);
}

/** P(Z > z) for a standard normal. */
export function normalSurvival(z: number): number {
  const tail = 0.5 * regularizedGammaQ(0.5, (z * z) / 2);
  return z >= 0 ? tail : 1 - tail;
}

export function normalTwoSidedP(z: number): number {
  return Math.min(1, 2 * normalSurvival(Math.abs(z)));
}

function betaContinuedFraction(a: number, b: number, x: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m < MAX_ITERATIONS; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b). */
export function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) return (front * betaContinuedFraction(a, b, x)) / a;
  return 1 - (front * betaContinuedFraction(b, a, 1 - x)) / b;
}

export function studentTTwoSidedP(t: number, degreesOfFreedom: number): number {
  if (!Number.isFinite(t)) return 0;
  const x = degreesOfFreedom / (degreesOfFreedom + t * t);
  return regularizedIncompleteBeta(x, degreesOfFreedom / 2, 0.5);
}

/** Two-sided critical value: t such that P(|T| > t) = alpha. */
export function studentTCritical(degreesOfFreedom: number, alpha = 0.05): number {
  let low = 0;
  let high = 1000;
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    if (studentTTwoSidedP(mid, degreesOfFreedom) > alpha) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

export function mean(values: readonly number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function sampleVariance(values: readonly number[]): number {
  const m = mean(values);
  return values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
}

export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface WelchResult {
  t: number;
  degreesOfFreedom: number;
  pValue: number;
  meanDifference: number;
  ci95: [number, number];
}

export function welchTTest(a: readonly number[], b: readonly number[]): WelchResult {
  const va = sampleVariance(a) / a.length;
  const vb = sampleVariance(b) / b.length;
  const se = Math.sqrt(va + vb);
  const diff = mean(a) - mean(b);
  const t = diff / se;
  const df = (va + vb) ** 2 / (va ** 2 / (a.length - 1) + vb ** 2 / (b.length - 1));
  const critical = studentTCritical(df);
  return {
    t,
    degreesOfFreedom: df,
    pValue: studentTTwoSidedP(t, df),
    meanDifference: diff,
    ci95: [diff - critical * se, diff + critical * se],
  };
}

export interface MannWhitneyResult {
  u: number;
  z: number;
  pValue: number;
}

/** Two-sided asymptotic Mann-Whitney U with tie and continuity correction
 * (same convention as scipy's method='asymptotic'). */
export function mannWhitneyU(a: readonly number[], b: readonly number[]): MannWhitneyResult {
  const n1 = a.length;
  const n2 = b.length;
  const combined = [...a.map((v) => ({ v, group: 0 })), ...b.map((v) => ({ v, group: 1 }))].sort((x, y) => x.v - y.v);
  const n = combined.length;
  const ranks = new Array<number>(n);
  let tieTerm = 0;
  for (let i = 0; i < n; ) {
    let j = i;
    while (j + 1 < n && combined[j + 1].v === combined[i].v) j++;
    const averageRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[k] = averageRank;
    const ties = j - i + 1;
    tieTerm += ties ** 3 - ties;
    i = j + 1;
  }
  let rankSumA = 0;
  combined.forEach((item, index) => {
    if (item.group === 0) rankSumA += ranks[index];
  });
  const u1 = rankSumA - (n1 * (n1 + 1)) / 2;
  const u2 = n1 * n2 - u1;
  const mu = (n1 * n2) / 2;
  const sigma = Math.sqrt(((n1 * n2) / 12) * (n + 1 - tieTerm / (n * (n - 1))));
  const z = (Math.max(u1, u2) - mu - 0.5) / sigma;
  return { u: u1, z, pValue: sigma === 0 ? 1 : Math.min(1, Math.max(0, 2 * normalSurvival(z))) };
}

export function cohensD(a: readonly number[], b: readonly number[]): number {
  const pooled = Math.sqrt(
    ((a.length - 1) * sampleVariance(a) + (b.length - 1) * sampleVariance(b)) / (a.length + b.length - 2),
  );
  return pooled === 0 ? 0 : (mean(a) - mean(b)) / pooled;
}

export function cohensH(p1: number, p2: number): number {
  return 2 * Math.asin(Math.sqrt(p1)) - 2 * Math.asin(Math.sqrt(p2));
}

export interface TwoByTwo {
  /** events in A */ a: number;
  /** non-events in A */ b: number;
  /** events in B */ c: number;
  /** non-events in B */ d: number;
}

export function expectedCounts(t: TwoByTwo): [number, number, number, number] {
  const n = t.a + t.b + t.c + t.d;
  const row1 = t.a + t.b;
  const row2 = t.c + t.d;
  const col1 = t.a + t.c;
  const col2 = t.b + t.d;
  return [(row1 * col1) / n, (row1 * col2) / n, (row2 * col1) / n, (row2 * col2) / n];
}

/** Pearson chi-square test of independence (no continuity correction), df = 1. */
export function chiSquare2x2(t: TwoByTwo): { statistic: number; pValue: number } {
  const expected = expectedCounts(t);
  const observed = [t.a, t.b, t.c, t.d];
  const statistic = observed.reduce((sum, o, i) => sum + (o - expected[i]) ** 2 / expected[i], 0);
  return { statistic, pValue: chiSquareSurvival(statistic, 1) };
}

function logFactorial(n: number): number {
  return logGamma(n + 1);
}

/** Two-sided Fisher exact test (sum of tables no more probable than the observed one). */
export function fisherExact2x2(t: TwoByTwo): number {
  const row1 = t.a + t.b;
  const row2 = t.c + t.d;
  const col1 = t.a + t.c;
  const n = row1 + row2;
  const logProbability = (x: number) =>
    logFactorial(row1) + logFactorial(row2) + logFactorial(col1) + logFactorial(n - col1) -
    logFactorial(n) - logFactorial(x) - logFactorial(row1 - x) - logFactorial(col1 - x) - logFactorial(row2 - col1 + x);
  const low = Math.max(0, col1 - row2);
  const high = Math.min(row1, col1);
  const observed = logProbability(t.a);
  let p = 0;
  for (let x = low; x <= high; x++) {
    const lp = logProbability(x);
    if (lp <= observed + 1e-7) p += Math.exp(lp);
  }
  return Math.min(1, p);
}

export function oddsRatio(t: TwoByTwo): { value: number; ci95: [number, number]; continuityAdjusted: boolean } {
  const adjusted = [t.a, t.b, t.c, t.d].some((cell) => cell === 0);
  const [a, b, c, d] = adjusted ? [t.a + 0.5, t.b + 0.5, t.c + 0.5, t.d + 0.5] : [t.a, t.b, t.c, t.d];
  const value = (a * d) / (b * c);
  const se = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
  return {
    value,
    ci95: [Math.exp(Math.log(value) - 1.959963984540054 * se), Math.exp(Math.log(value) + 1.959963984540054 * se)],
    continuityAdjusted: adjusted,
  };
}

export function wilsonInterval(successes: number, n: number): [number, number] {
  if (n <= 0) return [0, 0];
  const z = 1.959963984540054;
  const p = successes / n;
  const denominator = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denominator;
  return [Math.max(0, centre - margin), Math.min(1, centre + margin)];
}

export function differenceOfProportionsCi(
  successesA: number,
  nA: number,
  successesB: number,
  nB: number,
): { difference: number; ci95: [number, number] } {
  const pA = successesA / nA;
  const pB = successesB / nB;
  const se = Math.sqrt((pA * (1 - pA)) / nA + (pB * (1 - pB)) / nB);
  const difference = pA - pB;
  return { difference, ci95: [difference - 1.959963984540054 * se, difference + 1.959963984540054 * se] };
}

export type EffectSizeLabel = 'negligible' | 'small' | 'medium' | 'large';

/** Cohen's conventional thresholds, used for both d and h. */
export function effectSizeLabel(value: number): EffectSizeLabel {
  const magnitude = Math.abs(value);
  if (magnitude < 0.2) return 'negligible';
  if (magnitude < 0.5) return 'small';
  if (magnitude < 0.8) return 'medium';
  return 'large';
}

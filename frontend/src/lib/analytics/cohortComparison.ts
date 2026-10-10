import type Database from 'better-sqlite3';
import { normalizeFilters } from './filters';
import { buildWhereClause } from './sqlBuilder';
import type { AnalyticsFilterState } from './types';
import {
  chiSquare2x2,
  cohensD,
  cohensH,
  differenceOfProportionsCi,
  effectSizeLabel,
  expectedCounts,
  fisherExact2x2,
  mannWhitneyU,
  mean,
  median,
  oddsRatio,
  sampleVariance,
  welchTTest,
  wilsonInterval,
  type EffectSizeLabel,
} from './inference';

export const COHORT_OUTCOMES = {
  readmitted_30: { kind: 'binary', label: 'Readmitted within 30 days', column: null },
  time_in_hospital: { kind: 'numeric', label: 'Days in hospital', column: 'time_in_hospital' },
  num_medications: { kind: 'numeric', label: 'Number of medications', column: 'num_medications' },
  number_inpatient: { kind: 'numeric', label: 'Prior inpatient visits', column: 'number_inpatient' },
} as const;

export type OutcomeKey = keyof typeof COHORT_OUTCOMES;
export const ALPHA = 0.05;
const MIN_COHORT_SIZE = 30;
const MAX_FILTER_VALUE_LENGTH = 64;

export interface ComparisonInput {
  cohortA: AnalyticsFilterState;
  cohortB: AnalyticsFilterState;
  outcome: OutcomeKey;
}

export function validateComparisonRequest(
  body: unknown,
): { ok: true; value: ComparisonInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, error: 'Request body must be a JSON object' };
  const record = body as Record<string, unknown>;
  const outcome = record.outcome;
  if (typeof outcome !== 'string' || !(outcome in COHORT_OUTCOMES)) return { ok: false, error: 'Unknown outcome' };

  const cleaned: AnalyticsFilterState[] = [];
  for (const key of ['cohortA', 'cohortB'] as const) {
    const raw = record[key];
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, error: `${key} must be an object of filters` };
    for (const value of Object.values(raw as Record<string, unknown>)) {
      if (value !== null && value !== undefined && String(value).length > MAX_FILTER_VALUE_LENGTH) {
        return { ok: false, error: `${key} contains a filter value that is too long` };
      }
    }
    cleaned.push(normalizeFilters(raw));
  }
  return { ok: true, value: { cohortA: cleaned[0], cohortB: cleaned[1], outcome: outcome as OutcomeKey } };
}

function conditionsOf(filters: AnalyticsFilterState) {
  const { whereClause, params } = buildWhereClause(filters);
  return { sql: whereClause ? whereClause.replace(/^WHERE\s+/, '') : '1=1', params, where: whereClause };
}

export interface BinaryGroupSummary {
  n: number;
  events: number;
  rate: number;
  rateCi95: [number, number];
}

export interface NumericGroupSummary {
  n: number;
  mean: number;
  sd: number;
  median: number;
}

export interface ComparisonBase {
  outcome: OutcomeKey;
  outcomeLabel: string;
  overlap: { count: number; shareOfA: number; shareOfB: number };
  warnings: string[];
  caveats: string[];
  interpretation: string;
}

export interface BinaryComparison extends ComparisonBase {
  kind: 'binary';
  a: BinaryGroupSummary;
  b: BinaryGroupSummary;
  difference: { value: number; ci95: [number, number] };
  test: { name: 'chi-square' | 'fisher-exact'; statistic: number | null; pValue: number; reason: string };
  oddsRatio: { value: number; ci95: [number, number]; continuityAdjusted: boolean };
  cohensH: number;
  effectSize: EffectSizeLabel;
  significant: boolean;
}

export interface NumericComparison extends ComparisonBase {
  kind: 'numeric';
  a: NumericGroupSummary;
  b: NumericGroupSummary;
  welch: { t: number; degreesOfFreedom: number; pValue: number; meanDifference: number; ci95: [number, number] };
  mannWhitney: { u: number; z: number; pValue: number };
  cohensD: number;
  effectSize: EffectSizeLabel;
  significant: boolean;
}

export type ComparisonResult = BinaryComparison | NumericComparison;

export class ComparisonError extends Error {}

const STANDING_CAVEATS = [
  'Observational data: this shows association, not causation.',
  'Encounters are not independent — repeat patients contribute several encounters — so p-values are likely optimistic.',
  'Statistical significance is not clinical importance; read the effect size.',
];

function formatP(p: number): string {
  return p < 0.001 ? 'p < 0.001' : `p = ${p.toFixed(3)}`;
}

export function interpretBinary(r: Omit<BinaryComparison, 'interpretation'>): string {
  const pts = (r.difference.value * 100).toFixed(1);
  const lead = `Cohort A's rate is ${(r.a.rate * 100).toFixed(1)}% versus ${(r.b.rate * 100).toFixed(1)}% in cohort B (difference ${pts} percentage points, 95% CI ${(r.difference.ci95[0] * 100).toFixed(1)} to ${(r.difference.ci95[1] * 100).toFixed(1)}).`;
  const verdict = r.significant
    ? `The difference is statistically significant (${formatP(r.test.pValue)}) at α = ${ALPHA}, but the effect size is ${r.effectSize} (Cohen's h = ${r.cohensH.toFixed(2)}).`
    : `The difference is not statistically significant at α = ${ALPHA} (${formatP(r.test.pValue)}); the effect size is ${r.effectSize} (Cohen's h = ${r.cohensH.toFixed(2)}).`;
  return `${lead} ${verdict}`;
}

export function interpretNumeric(r: Omit<NumericComparison, 'interpretation'>): string {
  const lead = `Cohort A averages ${r.a.mean.toFixed(2)} versus ${r.b.mean.toFixed(2)} in cohort B (difference ${r.welch.meanDifference.toFixed(2)}, 95% CI ${r.welch.ci95[0].toFixed(2)} to ${r.welch.ci95[1].toFixed(2)}).`;
  const agree = (r.welch.pValue < ALPHA) === (r.mannWhitney.pValue < ALPHA);
  const verdict = r.significant
    ? `Welch's t-test is significant (${formatP(r.welch.pValue)}), but the effect size is ${r.effectSize} (Cohen's d = ${r.cohensD.toFixed(2)}).`
    : `Welch's t-test is not significant at α = ${ALPHA} (${formatP(r.welch.pValue)}); the effect size is ${r.effectSize} (Cohen's d = ${r.cohensD.toFixed(2)}).`;
  const robust = agree
    ? `The rank-based Mann–Whitney test agrees (${formatP(r.mannWhitney.pValue)}).`
    : `The rank-based Mann–Whitney test disagrees (${formatP(r.mannWhitney.pValue)}) — these counts are skewed, so weigh it heavily.`;
  return `${lead} ${verdict} ${robust}`;
}

function overlapOf(db: Database.Database, a: AnalyticsFilterState, b: AnalyticsFilterState, nA: number, nB: number) {
  const ca = conditionsOf(a);
  const cb = conditionsOf(b);
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM hospital_readmissions WHERE (${ca.sql}) AND (${cb.sql})`)
    .get(...ca.params, ...cb.params) as { n: number };
  return { count: row.n, shareOfA: nA ? row.n / nA : 0, shareOfB: nB ? row.n / nB : 0 };
}

function sharedWarnings(
  input: ComparisonInput,
  nA: number,
  nB: number,
  overlap: { count: number; shareOfA: number; shareOfB: number },
): string[] {
  const warnings: string[] = [];
  if (nA < MIN_COHORT_SIZE) warnings.push(`Cohort A has only ${nA} encounters (< ${MIN_COHORT_SIZE}); results are unreliable.`);
  if (nB < MIN_COHORT_SIZE) warnings.push(`Cohort B has only ${nB} encounters (< ${MIN_COHORT_SIZE}); results are unreliable.`);
  if (overlap.count > 0) {
    warnings.push(
      `${overlap.count.toLocaleString('en-US')} encounters (${(overlap.shareOfA * 100).toFixed(0)}% of A, ${(overlap.shareOfB * 100).toFixed(0)}% of B) belong to both cohorts; the tests assume independent groups.`,
    );
  }
  if (input.outcome === 'readmitted_30' && (input.cohortA.readmitted || input.cohortB.readmitted)) {
    warnings.push('A cohort is filtered on the readmitted field, which makes the readmission outcome degenerate.');
  }
  return warnings;
}

export function runCohortComparison(db: Database.Database, input: ComparisonInput): ComparisonResult {
  const spec = COHORT_OUTCOMES[input.outcome];
  const ca = conditionsOf(input.cohortA);
  const cb = conditionsOf(input.cohortB);

  if (spec.kind === 'binary') {
    const query = (c: ReturnType<typeof conditionsOf>) =>
      db
        .prepare(
          `SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END), 0) AS events
             FROM hospital_readmissions WHERE ${c.sql}`,
        )
        .get(...c.params) as { n: number; events: number };
    const rowA = query(ca);
    const rowB = query(cb);
    if (rowA.n === 0 || rowB.n === 0) throw new ComparisonError('One of the cohorts matches no encounters');

    const summarize = (row: { n: number; events: number }): BinaryGroupSummary => ({
      n: row.n,
      events: row.events,
      rate: row.events / row.n,
      rateCi95: wilsonInterval(row.events, row.n),
    });
    const a = summarize(rowA);
    const b = summarize(rowB);
    const table = { a: a.events, b: a.n - a.events, c: b.events, d: b.n - b.events };
    const smallestExpected = Math.min(...expectedCounts(table));
    const useFisher = smallestExpected < 5;
    const chi = chiSquare2x2(table);
    const pValue = useFisher ? fisherExact2x2(table) : chi.pValue;
    const h = cohensH(a.rate, b.rate);
    const overlap = overlapOf(db, input.cohortA, input.cohortB, a.n, b.n);

    const partial: Omit<BinaryComparison, 'interpretation'> = {
      kind: 'binary',
      outcome: input.outcome,
      outcomeLabel: spec.label,
      a,
      b,
      difference: (({ difference, ci95 }) => ({ value: difference, ci95 }))(differenceOfProportionsCi(a.events, a.n, b.events, b.n)),
      test: {
        name: useFisher ? 'fisher-exact' : 'chi-square',
        statistic: useFisher ? null : chi.statistic,
        pValue,
        reason: useFisher
          ? `Fisher's exact test used because an expected cell count (${smallestExpected.toFixed(1)}) is below 5.`
          : 'Pearson chi-square test of independence (no continuity correction); all expected counts are at least 5.',
      },
      oddsRatio: oddsRatio(table),
      cohensH: h,
      effectSize: effectSizeLabel(h),
      significant: pValue < ALPHA,
      overlap,
      warnings: sharedWarnings(input, a.n, b.n, overlap),
      caveats: STANDING_CAVEATS,
    };
    return { ...partial, interpretation: interpretBinary(partial) };
  }

  const column = spec.column;
  const fetchValues = (c: ReturnType<typeof conditionsOf>): number[] =>
    (db.prepare(`SELECT ${column} AS v FROM hospital_readmissions WHERE (${c.sql}) AND ${column} IS NOT NULL`).all(...c.params) as Array<{
      v: number;
    }>).map((row) => row.v);
  const valuesA = fetchValues(ca);
  const valuesB = fetchValues(cb);
  if (valuesA.length < 2 || valuesB.length < 2) throw new ComparisonError('Each cohort needs at least two encounters for a numeric comparison');

  const summarize = (values: number[]): NumericGroupSummary => ({
    n: values.length,
    mean: mean(values),
    sd: Math.sqrt(sampleVariance(values)),
    median: median(values),
  });
  const welch = welchTTest(valuesA, valuesB);
  const mw = mannWhitneyU(valuesA, valuesB);
  const d = cohensD(valuesA, valuesB);
  const overlap = overlapOf(db, input.cohortA, input.cohortB, valuesA.length, valuesB.length);
  const partial: Omit<NumericComparison, 'interpretation'> = {
    kind: 'numeric',
    outcome: input.outcome,
    outcomeLabel: spec.label,
    a: summarize(valuesA),
    b: summarize(valuesB),
    welch: {
      t: welch.t,
      degreesOfFreedom: welch.degreesOfFreedom,
      pValue: welch.pValue,
      meanDifference: welch.meanDifference,
      ci95: welch.ci95,
    },
    mannWhitney: { u: mw.u, z: mw.z, pValue: mw.pValue },
    cohensD: d,
    effectSize: effectSizeLabel(d),
    significant: welch.pValue < ALPHA,
    overlap,
    warnings: sharedWarnings(input, valuesA.length, valuesB.length, overlap),
    caveats: STANDING_CAVEATS,
  };
  return { ...partial, interpretation: interpretNumeric(partial) };
}

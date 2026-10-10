import type Database from 'better-sqlite3';
import { buildWhereClause, normalizeFilters, type AnalyticsFilterState } from '@/lib/analytics';
import { wilsonInterval } from '@/lib/analytics/inference';
import { labelFor, type IdMappings } from '@/lib/idMappings';

export const MIN_REPORTABLE_GROUP = 30;
const FINDING_MIN_GROUP = 100;

/** Death and hospice discharges cannot be followed by a readmission, so rates for them are meaningless. */
export const NON_READMITTABLE_DISPOSITIONS = new Set([11, 13, 14, 19, 20, 21]);

export interface Slice {
  code: number | null;
  label: string;
  n: number;
  share: number;
}

export interface RateSlice extends Slice {
  events: number;
  rate: number;
  ci95: [number, number];
}

export interface OperationsSummary {
  encounters: number;
  meanLos: number | null;
  medianLos: number | null;
  p90Los: number | null;
  emergencyAdmissionShare: number;
  dischargedHomeShare: number;
  thirtyDayRate: number;
  anyReadmissionRate: number;
}

export interface ResourceRow {
  label: string;
  n: number;
  labs: number;
  procedures: number;
  medications: number;
  diagnoses: number;
}

export interface OperationsData {
  empty: boolean;
  summary: OperationsSummary;
  admissionTypes: Slice[];
  admissionSources: Slice[];
  losHistogram: Array<{ days: number; count: number }>;
  losByAdmissionType: Array<{ label: string; meanLos: number; n: number }>;
  discharge: RateSlice[];
  dischargeNotReadmittable: Slice[];
  resourceByAdmissionType: ResourceRow[];
  priorInpatient: RateSlice[];
  priorEmergency: RateSlice[];
  suppressed: string[];
}

function whereFor(filters: AnalyticsFilterState): { where: string; params: Array<string | number | bigint | Buffer | null> } {
  const { whereClause, params } = buildWhereClause(normalizeFilters(filters));
  return { where: whereClause, params };
}

export function percentile(sortedValues: number[], fraction: number): number | null {
  if (sortedValues.length === 0) return null;
  const rank = Math.ceil(fraction * sortedValues.length);
  return sortedValues[Math.min(sortedValues.length, Math.max(1, rank)) - 1];
}

export function medianOf(sortedValues: number[]): number | null {
  if (sortedValues.length === 0) return null;
  const mid = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 ? sortedValues[mid] : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
}

function toSlice(code: number | null, label: string, n: number, total: number): Slice {
  return { code, label, n, share: total ? n / total : 0 };
}

function toRateSlice(slice: Slice, events: number): RateSlice {
  return { ...slice, events, rate: slice.n ? events / slice.n : 0, ci95: wilsonInterval(events, slice.n) };
}

export function getOperationsData(db: Database.Database, filters: AnalyticsFilterState, mappings: IdMappings): OperationsData {
  const { where, params } = whereFor(filters);
  const suppressed: string[] = [];

  const totals = db
    .prepare(
      `SELECT COUNT(*) AS n, AVG(time_in_hospital) AS mean_los,
              COALESCE(SUM(CASE WHEN admission_type_id = 1 THEN 1 ELSE 0 END), 0) AS emergency,
              COALESCE(SUM(CASE WHEN discharge_disposition_id = 1 THEN 1 ELSE 0 END), 0) AS home,
              COALESCE(SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END), 0) AS within30,
              COALESCE(SUM(CASE WHEN readmitted != 'NO' THEN 1 ELSE 0 END), 0) AS anyr
         FROM hospital_readmissions ${where}`,
    )
    .get(...params) as { n: number; mean_los: number | null; emergency: number; home: number; within30: number; anyr: number };

  const empty: OperationsData = {
    empty: true,
    summary: {
      encounters: 0, meanLos: null, medianLos: null, p90Los: null, emergencyAdmissionShare: 0,
      dischargedHomeShare: 0, thirtyDayRate: 0, anyReadmissionRate: 0,
    },
    admissionTypes: [], admissionSources: [], losHistogram: [], losByAdmissionType: [], discharge: [], dischargeNotReadmittable: [],
    resourceByAdmissionType: [], priorInpatient: [], priorEmergency: [], suppressed: [],
  };
  if (totals.n === 0) return empty;

  const losValues = (
    db.prepare(`SELECT time_in_hospital AS v FROM hospital_readmissions ${where} ORDER BY time_in_hospital`).all(...params) as Array<{
      v: number | null;
    }>
  )
    .map((row) => row.v)
    .filter((value): value is number => value !== null);

  const grouped = (column: string): Array<{ code: number | null; n: number; events: number }> =>
    db
      .prepare(
        `SELECT ${column} AS code, COUNT(*) AS n,
                COALESCE(SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END), 0) AS events
           FROM hospital_readmissions ${where} GROUP BY ${column} ORDER BY n DESC`,
      )
      .all(...params) as Array<{ code: number | null; n: number; events: number }>;

  const admissionTypes = grouped('admission_type_id').map((row) => toSlice(row.code, labelFor(mappings, 'admission_type_id', row.code), row.n, totals.n));
  const admissionSources = grouped('admission_source_id').map((row) => toSlice(row.code, labelFor(mappings, 'admission_source_id', row.code), row.n, totals.n));

  const discharge: RateSlice[] = [];
  const dischargeNotReadmittable: Slice[] = [];
  for (const row of grouped('discharge_disposition_id')) {
    const label = labelFor(mappings, 'discharge_disposition_id', row.code);
    if (row.code !== null && NON_READMITTABLE_DISPOSITIONS.has(row.code)) {
      dischargeNotReadmittable.push(toSlice(row.code, label, row.n, totals.n));
    } else if (row.n < MIN_REPORTABLE_GROUP) suppressed.push(`${label} (n=${row.n})`);
    else discharge.push(toRateSlice(toSlice(row.code, label, row.n, totals.n), row.events));
  }

  const losHistogram = (
    db
      .prepare(`SELECT time_in_hospital AS days, COUNT(*) AS count FROM hospital_readmissions ${where} GROUP BY time_in_hospital ORDER BY time_in_hospital`)
      .all(...params) as Array<{ days: number; count: number }>
  ).filter((row) => row.days !== null);

  const perType = db
    .prepare(
      `SELECT admission_type_id AS code, COUNT(*) AS n, AVG(time_in_hospital) AS los, AVG(num_lab_procedures) AS labs,
              AVG(num_procedures) AS procs, AVG(num_medications) AS meds, AVG(number_diagnoses) AS dx
         FROM hospital_readmissions ${where} GROUP BY admission_type_id ORDER BY n DESC`,
    )
    .all(...params) as Array<{ code: number | null; n: number; los: number; labs: number; procs: number; meds: number; dx: number }>;
  const losByAdmissionType: OperationsData['losByAdmissionType'] = [];
  const resourceByAdmissionType: ResourceRow[] = [];
  for (const row of perType) {
    const label = labelFor(mappings, 'admission_type_id', row.code);
    if (row.n < MIN_REPORTABLE_GROUP) {
      suppressed.push(`${label} resource profile (n=${row.n})`);
      continue;
    }
    losByAdmissionType.push({ label, meanLos: row.los, n: row.n });
    resourceByAdmissionType.push({ label, n: row.n, labs: row.labs, procedures: row.procs, medications: row.meds, diagnoses: row.dx });
  }

  const banded = (column: string, noun: string): RateSlice[] => {
    const rows = db
      .prepare(
        `SELECT MIN(${column}, 3) AS band, COUNT(*) AS n,
                COALESCE(SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END), 0) AS events
           FROM hospital_readmissions ${where} GROUP BY band ORDER BY band`,
      )
      .all(...params) as Array<{ band: number; n: number; events: number }>;
    const slices: RateSlice[] = [];
    for (const row of rows) {
      const label = row.band >= 3 ? `3+ prior ${noun}` : `${row.band} prior ${noun}`;
      if (row.n < MIN_REPORTABLE_GROUP) suppressed.push(`${label} (n=${row.n})`);
      else slices.push(toRateSlice(toSlice(row.band, label, row.n, totals.n), row.events));
    }
    return slices;
  };

  return {
    empty: false,
    summary: {
      encounters: totals.n,
      meanLos: totals.mean_los,
      medianLos: medianOf(losValues),
      p90Los: percentile(losValues, 0.9),
      emergencyAdmissionShare: totals.emergency / totals.n,
      dischargedHomeShare: totals.home / totals.n,
      thirtyDayRate: totals.within30 / totals.n,
      anyReadmissionRate: totals.anyr / totals.n,
    },
    admissionTypes,
    admissionSources,
    losHistogram,
    losByAdmissionType,
    discharge,
    dischargeNotReadmittable,
    resourceByAdmissionType,
    priorInpatient: banded('number_inpatient', 'inpatient visits'),
    priorEmergency: banded('number_emergency', 'emergency visits'),
    suppressed,
  };
}

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

/** Findings are generated by fixed rules from the computed numbers, never with a fixed confidence figure. */
export function buildOperationsFindings(data: OperationsData): string[] {
  if (data.empty) return ['No encounters match the current filters.'];
  const findings: string[] = [];

  const topType = data.admissionTypes[0];
  if (topType) findings.push(`${topType.label} is the most common admission type (${pct(topType.share)} of ${data.summary.encounters.toLocaleString('en-US')} encounters).`);

  const eligibleDischarge = data.discharge.filter((slice) => slice.n >= FINDING_MIN_GROUP);
  if (eligibleDischarge.length >= 2) {
    const highest = eligibleDischarge.reduce((a, b) => (b.rate > a.rate ? b : a));
    const lowest = eligibleDischarge.reduce((a, b) => (b.rate < a.rate ? b : a));
    findings.push(
      `Among discharge destinations with at least ${FINDING_MIN_GROUP} encounters, 30-day readmission is highest after "${highest.label}" (${pct(highest.rate)}, n=${highest.n.toLocaleString('en-US')}) and lowest after "${lowest.label}" (${pct(lowest.rate)}, n=${lowest.n.toLocaleString('en-US')}).`,
    );
  }

  const none = data.priorInpatient.find((slice) => slice.code === 0);
  const many = data.priorInpatient.find((slice) => slice.code === 3);
  if (none && many && none.rate > 0) {
    const overlap = many.ci95[0] <= none.ci95[1];
    findings.push(
      `Encounters with 3+ prior inpatient visits have a 30-day readmission rate of ${pct(many.rate)} versus ${pct(none.rate)} for none (${(many.rate / none.rate).toFixed(1)}×)${overlap ? ', though the intervals overlap' : ''}.`,
    );
  }

  if (data.summary.p90Los !== null && data.summary.medianLos !== null) {
    findings.push(`Median length of stay is ${data.summary.medianLos} days; 90% of stays end within ${data.summary.p90Los} days.`);
  }
  return findings;
}

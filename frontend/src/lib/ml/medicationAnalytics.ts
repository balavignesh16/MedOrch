import type Database from 'better-sqlite3';
import { wilsonInterval } from '@/lib/analytics/inference';

/** Fixed allowlist: these names are interpolated into SQL, never user input. */
export const MEDICATION_COLUMNS = [
  'metformin', 'repaglinide', 'nateglinide', 'chlorpropamide', 'glimepiride', 'acetohexamide',
  'glipizide', 'glyburide', 'tolbutamide', 'pioglitazone', 'rosiglitazone', 'acarbose', 'miglitol',
  'troglitazone', 'tolazamide', 'examide', 'citoglipton', 'insulin', 'glyburide_metformin',
  'glipizide_metformin', 'glimepiride_pioglitazone', 'metformin_rosiglitazone', 'metformin_pioglitazone',
] as const;

export const MIN_REPORTABLE_GROUP = 30;

export interface DrugPrevalence {
  drug: string;
  prescribedPercent: number;
  steady: number;
  up: number;
  down: number;
  total: number;
}

export interface RateRow {
  label: string;
  n: number;
  events: number;
  rate: number;
  ci95: [number, number];
}

export interface MedicationAnalytics {
  totalEncounters: number;
  prevalence: DrugPrevalence[];
  insulinReadmission: RateRow[];
  medicationChangeReadmission: RateRow[];
  suppressed: string[];
}

function toRateRow(label: string, n: number, events: number): RateRow {
  return { label, n, events, rate: n ? events / n : 0, ci95: wilsonInterval(events, n) };
}

export function getMedicationAnalytics(db: Database.Database): MedicationAnalytics {
  const total = (db.prepare('SELECT COUNT(*) AS n FROM hospital_readmissions').get() as { n: number }).n;

  const prevalenceSql = MEDICATION_COLUMNS.map(
    (column) =>
      `SUM(CASE WHEN ${column} = 'Steady' THEN 1 ELSE 0 END) AS ${column}_steady, ` +
      `SUM(CASE WHEN ${column} = 'Up' THEN 1 ELSE 0 END) AS ${column}_up, ` +
      `SUM(CASE WHEN ${column} = 'Down' THEN 1 ELSE 0 END) AS ${column}_down`,
  ).join(', ');
  const prevalenceRow = db.prepare(`SELECT ${prevalenceSql} FROM hospital_readmissions`).get() as Record<string, number>;
  const prevalence = MEDICATION_COLUMNS.map((drug) => {
    const steady = prevalenceRow[`${drug}_steady`] ?? 0;
    const up = prevalenceRow[`${drug}_up`] ?? 0;
    const down = prevalenceRow[`${drug}_down`] ?? 0;
    return { drug, steady, up, down, total, prescribedPercent: total ? ((steady + up + down) / total) * 100 : 0 };
  }).sort((a, b) => b.prescribedPercent - a.prescribedPercent);

  const suppressed: string[] = [];

  const insulinRows = db
    .prepare(
      `SELECT insulin AS label, COUNT(*) AS n, SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END) AS events
         FROM hospital_readmissions WHERE insulin IS NOT NULL GROUP BY insulin`,
    )
    .all() as Array<{ label: string; n: number; events: number }>;
  const insulinOrder = ['No', 'Steady', 'Down', 'Up'];
  const insulinReadmission: RateRow[] = [];
  for (const row of insulinRows.sort((a, b) => insulinOrder.indexOf(a.label) - insulinOrder.indexOf(b.label))) {
    if (row.n < MIN_REPORTABLE_GROUP) suppressed.push(`insulin = ${row.label} (n=${row.n})`);
    else insulinReadmission.push(toRateRow(row.label, row.n, row.events));
  }

  const changeExpression = MEDICATION_COLUMNS.map((column) => `(${column} IN ('Up', 'Down'))`).join(' + ');
  const changeRows = db
    .prepare(
      `SELECT MIN(changes, 3) AS bucket, COUNT(*) AS n, SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END) AS events
         FROM (SELECT readmitted, (${changeExpression}) AS changes FROM hospital_readmissions)
        GROUP BY bucket ORDER BY bucket`,
    )
    .all() as Array<{ bucket: number; n: number; events: number }>;
  const medicationChangeReadmission: RateRow[] = [];
  for (const row of changeRows) {
    const label = row.bucket >= 3 ? '3+ dose changes' : row.bucket === 1 ? '1 dose change' : `${row.bucket} dose changes`;
    if (row.n < MIN_REPORTABLE_GROUP) suppressed.push(`${label} (n=${row.n})`);
    else medicationChangeReadmission.push(toRateRow(label, row.n, row.events));
  }

  return { totalEncounters: total, prevalence, insulinReadmission, medicationChangeReadmission, suppressed };
}

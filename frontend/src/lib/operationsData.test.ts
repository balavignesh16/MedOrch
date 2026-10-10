import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseIdMappings } from './idMappings';
import { buildOperationsFindings, getOperationsData, medianOf, percentile } from './operationsData';

const mappings = parseIdMappings(
  [
    'admission_type_id,description', '1,Emergency', '3,Elective', '',
    'discharge_disposition_id,description', '1,Discharged to home', '3,Discharged/transferred to SNF', '6,Home with home health service', '',
    'admission_source_id,description', '7,Emergency Room', '1,Physician Referral',
  ].join('\n'),
);

let db: Database.Database;

interface Row {
  gender?: string;
  type: number;
  source?: number;
  discharge: number;
  los: number;
  readmitted: string;
  inpatient?: number;
  emergency?: number;
}

function seed(rows: Row[]): void {
  db.exec(`CREATE TABLE hospital_readmissions (
    encounter_id INTEGER, gender TEXT, age TEXT, race TEXT, admission_type_id INTEGER, admission_source_id INTEGER,
    discharge_disposition_id INTEGER, time_in_hospital INTEGER, num_lab_procedures INTEGER, num_procedures INTEGER,
    num_medications INTEGER, number_diagnoses INTEGER, number_inpatient INTEGER, number_emergency INTEGER,
    readmitted TEXT, diag_1 TEXT)`);
  const insert = db.prepare('INSERT INTO hospital_readmissions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  rows.forEach((row, index) =>
    insert.run(index + 1, row.gender ?? 'Female', '[60-70)', 'Caucasian', row.type, row.source ?? 7, row.discharge, row.los,
      40, 1, 15, 7, row.inpatient ?? 0, row.emergency ?? 0, row.readmitted, '250'),
  );
}

const repeat = (count: number, make: (i: number) => Row): Row[] => Array.from({ length: count }, (_, i) => make(i));

beforeEach(() => {
  db = new Database(':memory:');
});
afterEach(() => db.close());

describe('statistics helpers', () => {
  it('computes nearest-rank percentiles and medians', () => {
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.9)).toBe(9);
    expect(percentile([], 0.9)).toBeNull();
    expect(medianOf([1, 2, 3, 4])).toBe(2.5);
    expect(medianOf([1, 5, 9])).toBe(5);
    expect(medianOf([])).toBeNull();
  });
});

describe('getOperationsData', () => {
  it('summarises encounters, LOS, emergency share and both readmission definitions from the rows', () => {
    seed([
      ...repeat(60, (i) => ({ type: 1, discharge: 1, los: 2 + (i % 3), readmitted: i < 6 ? '<30' : i < 18 ? '>30' : 'NO' })),
      ...repeat(40, (i) => ({ type: 3, discharge: 3, los: 8, readmitted: i < 4 ? '<30' : 'NO' })),
    ]);
    const { summary } = getOperationsData(db, {}, mappings);
    expect(summary.encounters).toBe(100);
    expect(summary.emergencyAdmissionShare).toBeCloseTo(0.6, 12);
    expect(summary.dischargedHomeShare).toBeCloseTo(0.6, 12);
    expect(summary.thirtyDayRate).toBeCloseTo(10 / 100, 12);
    expect(summary.anyReadmissionRate).toBeCloseTo(22 / 100, 12);
    expect(summary.medianLos).toBe(4);
    expect(summary.p90Los).toBe(8);
    expect(summary.meanLos).toBeCloseTo((60 * 3 + 40 * 8) / 100, 6);
  });

  it('labels admission types and discharge destinations from the code tables, with Wilson intervals', () => {
    seed([
      ...repeat(80, (i) => ({ type: 1, discharge: 1, los: 3, readmitted: i < 8 ? '<30' : 'NO' })),
      ...repeat(40, (i) => ({ type: 3, discharge: 3, los: 5, readmitted: i < 12 ? '<30' : 'NO' })),
    ]);
    const data = getOperationsData(db, {}, mappings);
    expect(data.admissionTypes.map((s) => [s.label, s.n])).toEqual([['Emergency', 80], ['Elective', 40]]);
    const snf = data.discharge.find((s) => s.label.includes('SNF'))!;
    expect(snf).toMatchObject({ n: 40, events: 12, rate: 0.3 });
    expect(snf.ci95[0]).toBeLessThan(0.3);
    expect(snf.ci95[1]).toBeGreaterThan(0.3);
    expect(data.resourceByAdmissionType[0]).toMatchObject({ label: 'Emergency', n: 80, labs: 40, medications: 15 });
  });

  it('suppresses groups under 30 encounters instead of reporting rates for them', () => {
    seed([
      ...repeat(100, () => ({ type: 1, discharge: 1, los: 3, readmitted: 'NO' })),
      ...repeat(5, () => ({ type: 3, discharge: 6, los: 3, readmitted: '<30' })),
    ]);
    const data = getOperationsData(db, {}, mappings);
    expect(data.discharge.map((s) => s.label)).toEqual(['Discharged to home']);
    expect(data.suppressed).toContain('Home with home health service (n=5)');
    expect(data.resourceByAdmissionType.map((r) => r.label)).toEqual(['Emergency']);
    expect(data.suppressed).toContain('Elective resource profile (n=5)');
  });

  it('bands prior visits as 0, 1, 2, 3+ and reports each rate', () => {
    seed([
      ...repeat(100, () => ({ type: 1, discharge: 1, los: 3, readmitted: 'NO', inpatient: 0 })),
      ...repeat(50, (i) => ({ type: 1, discharge: 1, los: 3, readmitted: i < 25 ? '<30' : 'NO', inpatient: 5 })),
    ]);
    const { priorInpatient } = getOperationsData(db, {}, mappings);
    expect(priorInpatient.map((s) => s.label)).toEqual(['0 prior inpatient visits', '3+ prior inpatient visits']);
    expect(priorInpatient[1]).toMatchObject({ n: 50, events: 25, rate: 0.5 });
  });

  it('keeps death and hospice discharges out of the readmission rates and findings', () => {
    seed([
      ...repeat(150, (i) => ({ type: 1, discharge: 1, los: 3, readmitted: i < 15 ? '<30' : 'NO' })),
      ...repeat(150, (i) => ({ type: 1, discharge: 3, los: 3, readmitted: i < 45 ? '<30' : 'NO' })),
      ...repeat(120, () => ({ type: 1, discharge: 11, los: 3, readmitted: 'NO' })),
    ]);
    const labels = parseIdMappings(['discharge_disposition_id,description', '1,Discharged to home', '3,Discharged/transferred to SNF', '11,Expired'].join(String.fromCharCode(10)));
    const data = getOperationsData(db, {}, labels);
    expect(data.discharge.map((s) => s.label)).toEqual(expect.arrayContaining(['Discharged to home', 'Discharged/transferred to SNF']));
    expect(data.discharge.some((s) => s.label === 'Expired')).toBe(false);
    expect(data.dischargeNotReadmittable.map((s) => [s.label, s.n])).toEqual([['Expired', 120]]);
    const findings = buildOperationsFindings(data).join(' ');
    expect(findings).not.toContain('"Expired"');
    expect(findings).toContain('lowest after "Discharged to home"');
  });

  it('applies filters as bound parameters and returns an empty result when nothing matches', () => {
    seed([
      ...repeat(50, () => ({ gender: 'Female', type: 1, discharge: 1, los: 3, readmitted: 'NO' })),
      ...repeat(50, () => ({ gender: 'Male', type: 3, discharge: 3, los: 9, readmitted: 'NO' })),
    ]);
    expect(getOperationsData(db, { gender: 'Male' }, mappings).summary.meanLos).toBe(9);
    const injected = getOperationsData(db, { gender: "x' OR '1'='1" }, mappings);
    expect(injected.empty).toBe(true);
    expect(injected.summary.encounters).toBe(0);
  });

  it('builds the LOS histogram from real day counts', () => {
    seed(repeat(30, (i) => ({ type: 1, discharge: 1, los: i < 20 ? 2 : 4, readmitted: 'NO' })));
    expect(getOperationsData(db, {}, mappings).losHistogram).toEqual([{ days: 2, count: 20 }, { days: 4, count: 10 }]);
  });
});

describe('buildOperationsFindings', () => {
  it('generates findings from the numbers, including interval-overlap honesty', () => {
    seed([
      ...repeat(200, (i) => ({ type: 1, discharge: 1, los: 3, readmitted: i < 10 ? '<30' : 'NO', inpatient: 0 })),
      ...repeat(150, (i) => ({ type: 3, discharge: 3, los: 6, readmitted: i < 45 ? '<30' : 'NO', inpatient: 4 })),
    ]);
    const findings = buildOperationsFindings(getOperationsData(db, {}, mappings));
    const text = findings.join(' ');
    expect(text).toContain('Emergency is the most common admission type');
    expect(text).toContain('highest after "Discharged/transferred to SNF" (30.0%');
    expect(text).toContain('lowest after "Discharged to home" (5.0%');
    expect(text).toMatch(/3\+ prior inpatient visits have a 30-day readmission rate of 30\.0% versus 5\.0% for none \(6\.0×\)/);
    expect(text).toContain('Median length of stay');
    expect(text).not.toMatch(/confidence/i);
  });

  it('says so plainly when there is no data', () => {
    seed([{ type: 1, discharge: 1, los: 2, readmitted: 'NO' }]);
    expect(buildOperationsFindings(getOperationsData(db, { gender: 'Nobody' }, mappings))).toEqual(['No encounters match the current filters.']);
  });
});

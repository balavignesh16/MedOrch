import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSessionToken, getSessionSecret, SESSION_COOKIE } from '@/lib/auth/session';
import { GET } from './route';

let fixtureDirectory = '';
let databasePath = '';

function createFixtureDatabase(): void {
  const db = new Database(databasePath);
  db.exec(`
    CREATE TABLE patients (
      patient_id INTEGER PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      gender TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      insurance_provider TEXT NOT NULL
    );
    CREATE TABLE admissions (
      admission_id INTEGER PRIMARY KEY,
      patient_id INTEGER NOT NULL,
      department TEXT,
      admission_date TEXT,
      discharge_date TEXT,
      diagnosis TEXT,
      readmission_risk_score REAL
    );
    CREATE TABLE lab_results (
      lab_id INTEGER PRIMARY KEY,
      patient_id INTEGER NOT NULL,
      test_name TEXT NOT NULL,
      test_date TEXT NOT NULL,
      reference_range TEXT NOT NULL,
      test_value TEXT NOT NULL,
      test_unit TEXT NOT NULL,
      is_abnormal INTEGER NOT NULL
    );
    CREATE TABLE medications (
      medication_id INTEGER PRIMARY KEY,
      patient_id INTEGER NOT NULL,
      drug_name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      status TEXT NOT NULL,
      start_date TEXT NOT NULL
    );
    INSERT INTO patients VALUES (1, 'Asha', 'Rao', 'Female', '1980-01-01', 'Demo Plan');
    INSERT INTO admissions VALUES (1, 1, 'Cardiology', '2026-01-02', NULL, 'I10', 24.5);
    INSERT INTO lab_results VALUES (1, 1, 'A1C', '2026-01-03', '4-6', '7.1', '%', 1);
    INSERT INTO medications VALUES (1, 1, 'Metformin', '500 mg', 'Daily', 'Active', '2026-01-02');
  `);
  db.close();
}

async function requestPatient(id: string): Promise<Response> {
  const token = createSessionToken({ username: 'doctor', displayName: 'Attending Physician', role: 'doctor' }, getSessionSecret(), Date.now());
  return GET(new Request(`http://localhost/api/patients/${id}`, { headers: { cookie: `${SESSION_COOKIE}=${token}` } }), {
    params: Promise.resolve({ id }),
  });
}

beforeEach(() => {
  fixtureDirectory = mkdtempSync(path.join(tmpdir(), 'medorch-patient-route-'));
  databasePath = path.join(fixtureDirectory, 'fixture.db');
  process.env.MEDORCH_DB_PATH = databasePath;
  createFixtureDatabase();
});

afterEach(() => {
  delete process.env.MEDORCH_DB_PATH;
  rmSync(fixtureDirectory, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('GET /api/patients/[id]', () => {
  it('returns a patient with related records', async () => {
    const response = await requestPatient('1');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.patient.patient_id).toBe(1);
    expect(body.labs).toHaveLength(1);
    expect(body.medications).toHaveLength(1);
  });

  it('rejects an invalid patient ID', async () => {
    const response = await requestPatient('abc');
    expect(response.status).toBe(400);
  });

  it('returns 404 for an unknown patient', async () => {
    const response = await requestPatient('999');
    expect(response.status).toBe(404);
  });

  it('returns a safe 500 response when the database is unavailable', async () => {
    process.env.MEDORCH_DB_PATH = path.join(fixtureDirectory, 'missing.db');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await requestPatient('1');
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: 'internal_error', message: 'Internal Server Error' },
    });
  });
});

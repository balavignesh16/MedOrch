import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { getDatabasePath } from '@/lib/databaseConfig';
import { parsePatientId } from '@/lib/patientId';
import type { LabResultRow, MedicationRow, PatientDetailRow } from '@/lib/patientTypes';
import { apiError } from '@/lib/apiResponse';
import { requireSession } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = requireSession(request, ['admin', 'doctor']);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const patientId = parsePatientId(id);
  if (patientId === null) {
    return apiError('invalid_patient_id', 'Patient ID must be a positive integer', 400);
  }

  let db: Database.Database | null = null;
  try {
    db = new Database(getDatabasePath(), { readonly: true });
    db.pragma('query_only = ON');
    
    // Get patient details
    const patientQuery = `
      SELECT p.*, a.department, a.admission_date, a.diagnosis, a.readmission_risk_score 
      FROM patients p
      LEFT JOIN admissions a ON p.patient_id = a.patient_id
      WHERE p.patient_id = ?
      ORDER BY a.admission_date DESC
      LIMIT 1
    `;
    const patient = db.prepare(patientQuery).get(patientId) as PatientDetailRow | undefined;
    
    if (!patient) {
      return apiError('patient_not_found', 'Patient not found', 404);
    }

    // Get labs
    const labsQuery = `
      SELECT * FROM lab_results 
      WHERE patient_id = ? 
      ORDER BY test_date DESC
    `;
    const labs = db.prepare(labsQuery).all(patientId) as LabResultRow[];

    // Get medications
    const medicationColumns = db.prepare('PRAGMA table_info(medications)').all() as Array<{ name: string }>;
    const medicationDateColumn = medicationColumns.some((column) => column.name === 'start_date')
      ? 'start_date'
      : 'prescribed_date';
    const medsQuery = `
      SELECT * FROM medications 
      WHERE patient_id = ? 
      ORDER BY ${medicationDateColumn} DESC
    `;
    const meds = db.prepare(medsQuery).all(patientId) as MedicationRow[];

    return NextResponse.json({ 
      patient,
      labs,
      medications: meds 
    });
  } catch (error) {
    console.error("Error fetching patient details:", error);
    return apiError('internal_error', 'Internal Server Error', 500);
  } finally {
    db?.close();
  }
}

import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const patientId = params.id;
    const dbPath = path.resolve(process.cwd(), '../database/medorch.db');
    const db = new Database(dbPath, { readonly: true });
    
    // Get patient details
    const patientQuery = `
      SELECT p.*, a.department, a.admission_date, a.diagnosis, a.readmission_risk_score 
      FROM patients p
      LEFT JOIN admissions a ON p.patient_id = a.patient_id
      WHERE p.patient_id = ?
      ORDER BY a.admission_date DESC
      LIMIT 1
    `;
    const patient = db.prepare(patientQuery).get(patientId);
    
    if (!patient) {
      db.close();
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Get labs
    const labsQuery = `
      SELECT * FROM lab_results 
      WHERE patient_id = ? 
      ORDER BY test_date DESC
    `;
    const labs = db.prepare(labsQuery).all(patientId);

    // Get medications
    const medsQuery = `
      SELECT * FROM medications 
      WHERE patient_id = ? 
      ORDER BY start_date DESC
    `;
    const meds = db.prepare(medsQuery).all(patientId);

    db.close();

    return NextResponse.json({ 
      patient,
      labs,
      medications: meds 
    });
  } catch (error) {
    console.error("Error fetching patient details:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

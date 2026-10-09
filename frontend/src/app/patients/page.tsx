import React from 'react';
import Database from 'better-sqlite3';
import PatientsTable from '@/components/PatientsTable';
import { getDatabasePath } from '@/lib/databaseConfig';
import type { PatientListRow } from '@/lib/patientTypes';

// We must tell Next.js to dynamically render this route if we read directly from DB at request time
export const dynamic = 'force-dynamic';

function getPatients(): PatientListRow[] {
  let db: Database.Database | null = null;
  try {
    db = new Database(getDatabasePath(), { readonly: true });
    db.pragma('query_only = ON');
    
    // Get patients and their latest admission status
    const query = `
      SELECT 
        p.patient_id,
        p.first_name || ' ' || p.last_name as name,
        COALESCE(a.department, 'Not Admitted') as dept,
        CASE
          WHEN a.discharge_date IS NULL AND a.admission_date IS NOT NULL THEN 'Admitted'
          WHEN a.discharge_date IS NOT NULL THEN 'Discharged'
          ELSE 'Outpatient'
        END as status,
        COALESCE(a.readmission_risk_score, 0) as risk_score
      FROM patients p
      LEFT JOIN admissions a ON p.patient_id = a.patient_id
      ORDER BY p.patient_id ASC
      LIMIT 100
    `;
    
    return db.prepare(query).all() as PatientListRow[];
  } catch (error) {
    console.error("Error fetching patients from DB:", error);
    return [];
  } finally {
    db?.close();
  }
}

export default function PatientsPage() {
  const patients = getPatients();

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Patient Directory</h2>
        <p className="text-slate-400 mt-2">Manage and view patient records. Currently displaying {patients.length} active records from SQLite Database.</p>
      </header>

      <PatientsTable initialPatients={patients} />
    </div>
  );
}

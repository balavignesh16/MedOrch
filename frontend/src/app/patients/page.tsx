import React from 'react';
import Database from 'better-sqlite3';
import path from 'path';

// We must tell Next.js to dynamically render this route if we read directly from DB at request time
export const dynamic = 'force-dynamic';

function getPatients() {
  try {
    // Resolve the absolute path to the sqlite file created by python in /database
    const dbPath = path.resolve(process.cwd(), '../database/medorch.db');
    const db = new Database(dbPath, { readonly: true });
    
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
    
    const rows = db.prepare(query).all();
    db.close();
    return rows as any[];
  } catch (error) {
    console.error("Error fetching patients from DB:", error);
    return [];
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

      <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-border-glass text-slate-300">
              <th className="p-4 font-semibold text-sm">Patient ID</th>
              <th className="p-4 font-semibold text-sm">Name</th>
              <th className="p-4 font-semibold text-sm">Department</th>
              <th className="p-4 font-semibold text-sm">Status</th>
              <th className="p-4 font-semibold text-sm">Risk Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-glass">
            {patients.map((patient, idx) => {
              const isCritical = patient.risk_score > 75;
              const isHigh = patient.risk_score > 50;
              const isModerate = patient.risk_score > 25;
              
              return (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-sm font-mono text-slate-400">PT-{patient.patient_id.toString().padStart(4, '0')}</td>
                  <td className="p-4 text-sm font-medium text-white">{patient.name}</td>
                  <td className="p-4 text-sm text-slate-300">{patient.dept}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      patient.status === 'Admitted' ? 'bg-amber-500/20 text-amber-400' : 
                      patient.status === 'Outpatient' ? 'bg-slate-500/20 text-slate-400' :
                      'bg-brand-teal/20 text-brand-teal'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isCritical ? 'bg-red-500/20 text-red-400' :
                      isHigh ? 'bg-orange-500/20 text-orange-400' :
                      isModerate ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {patient.risk_score.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
            {patients.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No patients found in database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

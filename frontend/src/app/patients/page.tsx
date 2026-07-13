import React from 'react';

export default function PatientsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Patient Directory</h2>
        <p className="text-slate-400 mt-2">Manage and view patient records.</p>
      </header>

      <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-border-glass text-slate-300">
              <th className="p-4 font-semibold text-sm">Patient ID</th>
              <th className="p-4 font-semibold text-sm">Name</th>
              <th className="p-4 font-semibold text-sm">Department</th>
              <th className="p-4 font-semibold text-sm">Status</th>
              <th className="p-4 font-semibold text-sm">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-glass">
            {[ 
              { id: "PT-8942", name: "Robert Chen", dept: "Cardiology", status: "Admitted", risk: "High" },
              { id: "PT-9103", name: "Sarah Jenkins", dept: "Neurology", status: "Discharged", risk: "Low" },
              { id: "PT-1044", name: "Michael Ross", dept: "ICU", status: "Critical", risk: "Severe" },
              { id: "PT-3302", name: "Emily Davis", dept: "Pediatrics", status: "Stable", risk: "Low" },
              { id: "PT-5519", name: "James Wilson", dept: "Oncology", status: "Admitted", risk: "Moderate" }
            ].map((patient, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-sm font-mono text-slate-400">{patient.id}</td>
                <td className="p-4 text-sm font-medium text-white">{patient.name}</td>
                <td className="p-4 text-sm text-slate-300">{patient.dept}</td>
                <td className="p-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    patient.status === 'Critical' ? 'bg-red-500/20 text-red-400' : 
                    patient.status === 'Admitted' ? 'bg-amber-500/20 text-amber-400' : 
                    'bg-brand-teal/20 text-brand-teal'
                  }`}>
                    {patient.status}
                  </span>
                </td>
                <td className="p-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    patient.risk === 'Severe' ? 'bg-red-500/20 text-red-400' :
                    patient.risk === 'High' ? 'bg-orange-500/20 text-orange-400' :
                    patient.risk === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {patient.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { Download, Search, Filter } from 'lucide-react';

interface Patient {
  patient_id: number;
  name: string;
  dept: string;
  status: string;
  risk_score: number;
}

export default function PatientsTable({ initialPatients }: { initialPatients: Patient[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredPatients = initialPatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          `PT-${p.patient_id.toString().padStart(4, '0')}`.includes(search);
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['Patient ID', 'Name', 'Department', 'Status', 'Risk Score (%)'];
    const rows = filteredPatients.map(p => [
      `PT-${p.patient_id.toString().padStart(4, '0')}`,
      p.name,
      p.dept,
      p.status,
      p.risk_score.toFixed(1)
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'medorch_patients_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface-glass border border-border-glass text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-brand-teal transition-colors w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-glass border border-border-glass text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-brand-teal transition-colors"
            >
              <option value="All">All Statuses</option>
              <option value="Admitted">Admitted</option>
              <option value="Discharged">Discharged</option>
              <option value="Outpatient">Outpatient</option>
            </select>
          </div>
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-brand-teal/10 text-brand-teal border border-brand-teal/20 hover:bg-brand-teal hover:text-white transition-colors px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

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
            {filteredPatients.map((patient, idx) => {
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
            {filteredPatients.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No patients found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

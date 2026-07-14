"use client";

import React, { useState } from 'react';
import { Download, Search, Filter, X, Activity, Pill, User, FileText, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const filteredPatients = initialPatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          `PT-${p.patient_id.toString().padStart(4, '0')}`.includes(search);
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRowClick = async (patientId: number) => {
    setSelectedPatient(patientId);
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      const data = await res.json();
      setPatientDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

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
    <div className="space-y-4 relative">
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
                <tr 
                  key={idx} 
                  onClick={() => handleRowClick(patient.patient_id)}
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                >
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

      {/* Patient 360 Modal */}
      <AnimatePresence>
        {selectedPatient !== null && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatient(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-surface-glass border-l border-border-glass backdrop-blur-2xl shadow-2xl z-50 overflow-y-auto"
            >
              {isLoadingDetails || !patientDetails ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-teal border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-brand-teal/20 flex items-center justify-center">
                        <User className="w-8 h-8 text-brand-teal" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{patientDetails.patient.first_name} {patientDetails.patient.last_name}</h2>
                        <p className="text-slate-400 font-mono">PT-{patientDetails.patient.patient_id.toString().padStart(4, '0')} • {patientDetails.patient.gender} • DOB: {patientDetails.patient.date_of_birth}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedPatient(null)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6 text-slate-400" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 rounded-xl border border-border-glass bg-white/5">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Current Department</p>
                      <p className="text-white font-medium">{patientDetails.patient.department || 'Not Admitted'}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border-glass bg-white/5">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Primary Diagnosis</p>
                      <p className="text-white font-medium">{patientDetails.patient.diagnosis || 'N/A'}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border-glass bg-white/5">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Insurance</p>
                      <p className="text-white font-medium">{patientDetails.patient.insurance_provider}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
                      <p className="text-xs text-amber-500/70 uppercase font-semibold mb-1">Readmission Risk</p>
                      <p className="text-amber-400 font-bold text-xl">{patientDetails.patient.readmission_risk_score.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Lab Results Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-brand-blue" /> 
                        Recent Lab Results
                      </h3>
                      {patientDetails.labs.length > 0 ? (
                        <div className="space-y-2">
                          {patientDetails.labs.map((lab: any) => (
                            <div key={lab.lab_id} className="p-3 rounded-xl border border-border-glass bg-white/5 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-white">{lab.test_name}</p>
                                <p className="text-xs text-slate-500">{new Date(lab.test_date).toLocaleString()} • Ref: {lab.reference_range}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-sm font-bold ${lab.is_abnormal ? 'text-red-400' : 'text-green-400'}`}>
                                  {lab.test_value} {lab.test_unit}
                                </span>
                                {lab.is_abnormal && <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Abnormal</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No lab results on file.</p>
                      )}
                    </div>

                    {/* Medications Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-brand-teal" /> 
                        Active Medications
                      </h3>
                      {patientDetails.medications.length > 0 ? (
                        <div className="space-y-2">
                          {patientDetails.medications.map((med: any) => (
                            <div key={med.medication_id} className="p-3 rounded-xl border border-border-glass bg-white/5 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-white">{med.drug_name} {med.dosage}</p>
                                <p className="text-xs text-slate-500">{med.frequency}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${med.status === 'Active' ? 'bg-brand-teal/20 text-brand-teal' : 'bg-slate-500/20 text-slate-400'}`}>
                                {med.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No active medications.</p>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


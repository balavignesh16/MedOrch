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

      <div className="bg-surface-obsidian border border-border-glass rounded-xl overflow-hidden shadow-2xl relative">
        {/* Subtle background glow */}
        <div className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] bg-brand-teal/5 rounded-full blur-[80px] pointer-events-none"></div>
        
        <table className="w-full text-left border-collapse relative z-10">
          <thead>
            <tr className="bg-white/[0.02] border-b border-border-glass text-slate-400">
              <th className="p-4 font-semibold text-xs tracking-wider uppercase">Patient ID</th>
              <th className="p-4 font-semibold text-xs tracking-wider uppercase">Name</th>
              <th className="p-4 font-semibold text-xs tracking-wider uppercase">Department</th>
              <th className="p-4 font-semibold text-xs tracking-wider uppercase">Status</th>
              <th className="p-4 font-semibold text-xs tracking-wider uppercase">Risk Score</th>
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
                  className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <td className="p-4 text-sm font-mono text-slate-400 group-hover:text-brand-teal transition-colors">PT-{patient.patient_id.toString().padStart(4, '0')}</td>
                  <td className="p-4 text-sm font-medium text-white flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center shrink-0">
                      <User className="w-3 h-3 text-brand-teal" />
                    </div>
                    {patient.name}
                  </td>
                  <td className="p-4 text-sm text-slate-300">{patient.dept}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        patient.status === 'Admitted' ? 'bg-amber-400 shadow-[0_0_5px_#fbbf24] animate-pulse' : 
                        patient.status === 'Outpatient' ? 'bg-slate-400 shadow-[0_0_5px_#94a3b8]' :
                        'bg-brand-teal shadow-[0_0_5px_#14b8a6]'
                      }`} />
                      <span className={`text-xs font-mono uppercase tracking-wider ${
                        patient.status === 'Admitted' ? 'text-amber-400' : 
                        patient.status === 'Outpatient' ? 'text-slate-400' :
                        'text-brand-teal'
                      }`}>
                        {patient.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono font-bold ${
                        isCritical ? 'text-red-400' :
                        isHigh ? 'text-orange-400' :
                        isModerate ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {patient.risk_score.toFixed(1)}%
                      </span>
                      {isCritical && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredPatients.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <Activity className="w-8 h-8 mb-3 opacity-20" />
                    <p className="text-sm font-mono">No patients found matching criteria.</p>
                  </div>
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
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-surface-obsidian border-l border-border-glass shadow-2xl z-50 overflow-y-auto"
            >
              {isLoadingDetails || !patientDetails ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-2 border-brand-teal border-t-transparent animate-spin" />
                  <p className="text-xs text-brand-teal font-mono uppercase tracking-widest animate-pulse">Retrieving Records...</p>
                </div>
              ) : (
                <div className="p-8 relative">
                  {/* Modal Background Glow */}
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-teal/5 rounded-full blur-[100px] pointer-events-none"></div>
                  
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.15)]">
                        <User className="w-8 h-8 text-brand-teal" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{patientDetails.patient.first_name} {patientDetails.patient.last_name}</h2>
                        <p className="text-slate-400 font-mono text-sm mt-1">PT-{patientDetails.patient.patient_id.toString().padStart(4, '0')} • {patientDetails.patient.gender} • DOB: {patientDetails.patient.date_of_birth}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedPatient(null)}
                      className="p-2 hover:bg-white/[0.04] rounded-lg transition-colors border border-transparent hover:border-border-glass"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                    <div className="p-4 rounded-xl border border-border-glass bg-white/[0.02]">
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Current Department</p>
                      <p className="text-white font-medium">{patientDetails.patient.department || 'Not Admitted'}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border-glass bg-white/[0.02]">
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Primary Diagnosis</p>
                      <p className="text-white font-medium">{patientDetails.patient.diagnosis || 'N/A'}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border-glass bg-white/[0.02]">
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Insurance</p>
                      <p className="text-white font-medium">{patientDetails.patient.insurance_provider}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-brand-orange/30 bg-brand-orange/5 shadow-[0_0_15px_rgba(249,115,22,0.05)]">
                      <p className="text-xs text-brand-orange/70 uppercase tracking-widest font-semibold mb-1">Readmission Risk</p>
                      <p className="text-brand-orange font-bold text-2xl font-mono">{patientDetails.patient.readmission_risk_score.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    {/* Lab Results Section */}
                    <div>
                      <h3 className="text-xs font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <Activity className="w-4 h-4 text-brand-cyan" /> 
                        Recent Lab Results
                      </h3>
                      {patientDetails.labs.length > 0 ? (
                        <div className="space-y-2">
                          {patientDetails.labs.map((lab: any) => (
                            <div key={lab.lab_id} className="p-4 rounded-xl border border-border-glass bg-white/[0.02] flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                              <div>
                                <p className="text-sm font-medium text-slate-200">{lab.test_name}</p>
                                <p className="text-xs text-slate-500 font-mono mt-1">{new Date(lab.test_date).toLocaleString()} • Ref: {lab.reference_range}</p>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <span className={`text-sm font-mono font-bold ${lab.is_abnormal ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]' : 'text-green-400'}`}>
                                  {lab.test_value} <span className="text-xs font-normal opacity-70">{lab.test_unit}</span>
                                </span>
                                {lab.is_abnormal && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-border-glass border-dashed flex items-center justify-center">
                          <p className="text-sm text-slate-500 font-mono">No lab results on file.</p>
                        </div>
                      )}
                    </div>

                    {/* Medications Section */}
                    <div>
                      <h3 className="text-xs font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <Pill className="w-4 h-4 text-brand-teal" /> 
                        Active Medications
                      </h3>
                      {patientDetails.medications.length > 0 ? (
                        <div className="space-y-2">
                          {patientDetails.medications.map((med: any) => (
                            <div key={med.medication_id} className="p-4 rounded-xl border border-border-glass bg-white/[0.02] flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                              <div>
                                <p className="text-sm font-medium text-slate-200">{med.drug_name} <span className="text-brand-teal font-mono ml-2">{med.dosage}</span></p>
                                <p className="text-xs text-slate-500 font-mono mt-1">{med.frequency}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${med.status === 'Active' ? 'bg-brand-teal shadow-[0_0_5px_#14b8a6]' : 'bg-slate-500'}`} />
                                <span className={`text-xs font-mono uppercase tracking-wider ${med.status === 'Active' ? 'text-brand-teal' : 'text-slate-500'}`}>
                                  {med.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-border-glass border-dashed flex items-center justify-center">
                          <p className="text-sm text-slate-500 font-mono">No active medications on file.</p>
                        </div>
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


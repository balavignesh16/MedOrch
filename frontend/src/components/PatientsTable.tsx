"use client";

import React, { useState } from 'react';
import { Download, Search, Filter, X, Activity, Pill, User, FileText, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isPatientDetailsResponse, PatientDetailsResponse, PatientListRow } from '@/lib/patientTypes';

export default function PatientsTable({ initialPatients }: { initialPatients: PatientListRow[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [patientDetails, setPatientDetails] = useState<PatientDetailsResponse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredPatients = initialPatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          `PT-${p.patient_id.toString().padStart(4, '0')}`.includes(search);
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRowClick = async (patientId: number) => {
    setSelectedPatient(patientId);
    setModalOpen(true);
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      const data: unknown = await res.json();
      if (!res.ok || !isPatientDetailsResponse(data)) {
        throw new Error('Unable to load patient details');
      }
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
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 hover:border-brand-teal/30 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search ID or Diagnosis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400 w-48 font-mono"
            />
            </div>
          </div>
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-brand-teal transition-colors" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-2xl pl-11 pr-8 py-2.5 focus:outline-none focus:border-brand-teal/50 transition-all appearance-none cursor-pointer"
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
          className="flex items-center gap-2 bg-brand-teal text-white border border-brand-teal hover:bg-brand-teal/90 transition-all px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-brand-teal/20"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col h-[500px]">
      {/* Ambient background glow */}
      <div className="absolute -bottom-[200px] -right-[200px] w-[500px] h-[500px] bg-brand-teal/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse relative z-10">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                {['Patient ID', 'Dept', 'Diagnosis', 'Status', 'Risk Score', 'Actions'].map((header, i) => (
                  <th key={i} className="px-4 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => {
                const isHighRisk = patient.risk_score > 50;
                return (
                  <tr key={patient.patient_id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => handleRowClick(patient.patient_id)}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:border-brand-teal/30 transition-all">
                          <User className="w-4 h-4 text-slate-400 group-hover:text-brand-teal" />
                        </div>
                        <span className="font-mono text-sm text-slate-900 font-bold group-hover:text-brand-teal transition-colors">
                          PT-{patient.patient_id.toString().padStart(4, '0')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600 font-medium tracking-wide">{patient.dept}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-900 font-medium">N/A</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${ 
                          patient.status === 'Admitted' ? 'bg-amber-400' : 
                          patient.status === 'Outpatient' ? 'bg-slate-400' :
                          'bg-brand-teal'
                        }`} />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{patient.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                        <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-2 w-max
                          ${isHighRisk ? 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                        >
                          {isHighRisk && <AlertTriangle className="w-3 h-3" />}
                          <span className="text-xs font-bold font-mono">{patient.risk_score.toFixed(1)}</span>
                        </div>
                    </td>
                    <td className="px-4 py-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(patient.patient_id);
                          }}
                          className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-brand-teal"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient 360 Modal */}
      <AnimatePresence>
        {modalOpen && selectedPatient !== null && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white border-l border-slate-200 shadow-2xl z-50 overflow-y-auto"
            >
              {isLoadingDetails || !patientDetails ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-brand-teal/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-brand-teal border-t-transparent animate-spin" />
                  </div>
                </div>
              ) : (
                <div className="p-10">
                  <div className="flex items-start justify-between mb-10">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-3xl bg-brand-teal/10 border border-brand-teal/30 flex items-center justify-center">
                        <User className="w-10 h-10 text-brand-teal" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-slate-900">{patientDetails.patient.first_name} {patientDetails.patient.last_name}</h2>
                        <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-widest">PT-{patientDetails.patient.patient_id.toString().padStart(4, '0')} • {patientDetails.patient.gender} • DOB: {patientDetails.patient.date_of_birth}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setModalOpen(false)}
                      className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-6 mb-10">
                    <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-2">Current Department</p>
                      <p className="text-slate-900 font-bold tracking-wide">{patientDetails.patient.department || 'Not Admitted'}</p>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-2">Primary Diagnosis</p>
                      <p className="text-slate-900 font-bold tracking-wide">{patientDetails.patient.diagnosis || 'N/A'}</p>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-2">Insurance</p>
                      <p className="text-slate-900 font-bold tracking-wide">{patientDetails.patient.insurance_provider}</p>
                    </div>
                    <div className="p-5 rounded-2xl border border-brand-orange/20 bg-brand-orange/5 shadow-sm">
                      <p className="text-[10px] text-brand-orange/80 uppercase tracking-[0.2em] font-bold mb-2">Readmission Risk</p>
                      <p className="text-brand-orange font-black text-3xl font-mono tracking-tighter">{patientDetails.patient.readmission_risk_score.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="space-y-8 relative z-10">
                    {/* Lab Results Section */}
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-900 mb-5 flex items-center gap-3 uppercase tracking-[0.2em]">
                        <Activity className="w-4 h-4 text-brand-cyan" /> 
                        Recent Lab Results
                      </h3>
                      {patientDetails.labs.length > 0 ? (
                        <div className="space-y-3">
                          {patientDetails.labs.map((lab) => (
                            <div key={lab.lab_id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-all">
                              <div>
                                <p className="text-sm font-bold text-slate-900 tracking-wide">{lab.test_name}</p>
                                <p className="text-[11px] text-slate-500 font-mono mt-1.5 uppercase tracking-widest">{new Date(lab.test_date).toLocaleString()} • Ref: {lab.reference_range}</p>
                              </div>
                              <div className="text-right flex items-center gap-4">
                                <span className={`text-base font-mono font-black ${lab.is_abnormal ? 'text-red-500' : 'text-green-600'}`}>
                                  {lab.test_value} <span className="text-[10px] font-bold opacity-60 ml-1">{lab.test_unit}</span>
                                </span>
                                {lab.is_abnormal && <AlertTriangle className="w-5 h-5 text-red-500" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl border border-slate-200 border-dashed flex items-center justify-center bg-slate-50">
                          <p className="text-xs text-slate-500 font-mono uppercase tracking-[0.2em]">No lab results on file.</p>
                        </div>
                      )}
                    </div>

                    {/* Medications Section */}
                    <div>
                      <h3 className="text-[10px] font-bold text-slate-900 mb-5 flex items-center gap-3 uppercase tracking-[0.2em]">
                        <Pill className="w-4 h-4 text-brand-teal" /> 
                        Active Medications
                      </h3>
                      {patientDetails.medications.length > 0 ? (
                        <div className="space-y-3">
                          {patientDetails.medications.map((med) => (
                            <div key={med.medication_id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-all">
                              <div>
                                <p className="text-sm font-bold text-slate-900 tracking-wide">{med.drug_name} <span className="text-brand-teal font-mono ml-3 text-[11px] px-2 py-0.5 rounded border border-brand-teal/30 bg-brand-teal/10">{med.dosage}</span></p>
                                <p className="text-[11px] text-slate-500 font-mono mt-2 uppercase tracking-widest">{med.frequency}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${med.status === 'Active' ? 'bg-brand-teal' : 'bg-slate-300'}`} />
                                <span className={`text-[10px] font-bold font-mono uppercase tracking-[0.2em] ${med.status === 'Active' ? 'text-brand-teal' : 'text-slate-500'}`}>
                                  {med.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl border border-slate-200 border-dashed flex items-center justify-center bg-slate-50">
                          <p className="text-xs text-slate-500 font-mono uppercase tracking-[0.2em]">No active medications on file.</p>
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

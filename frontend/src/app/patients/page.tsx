"use client";

import React, { useEffect, useState } from 'react';
import { User, Activity, AlertCircle, Search, Calendar, FileText, Pill, FileHeart, ChevronRight, X, Bot, Plus, Edit } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import { motion, AnimatePresence } from 'framer-motion';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  baselineRiskScore: number;
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', age: 30, gender: 'Female', baselineRiskScore: 0.1
  });

  const fetchPatients = () => {
    fetch('http://localhost:8080/api/patients')
      .then((res) => res.json())
      .then((data) => {
        setPatients(data || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching patients:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-calculate risk score based on age (simulating an ML model)
    const calculatedRisk = formData.age > 65 ? (0.6 + Math.random() * 0.3) : (0.1 + Math.random() * 0.4);
    
    const payload = { ...formData, baselineRiskScore: parseFloat(calculatedRisk.toFixed(2)) };
    
    try {
      const res = await fetch('http://localhost:8080/api/patients/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to add patient");
      setIsAddModalOpen(false);
      fetchPatients();
    } catch (err) {
      console.error(err);
      alert("Error adding patient. Ensure backend is running.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      const res = await fetch(`http://localhost:8080/api/patients/update?id=${selectedPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Failed to update patient");
      setIsEditMode(false);
      setSelectedPatient({ ...selectedPatient, ...formData });
      fetchPatients();
    } catch (err) {
      console.error(err);
      alert("Error updating patient.");
    }
  };

  const openEditModal = (p: Patient) => {
    setFormData({
      firstName: p.firstName, lastName: p.lastName, age: p.age, gender: p.gender, baselineRiskScore: p.baselineRiskScore
    });
    setIsEditMode(true);
  };

  const highRiskCount = patients.filter(p => p.baselineRiskScore > 0.7).length;
  
  const filteredPatients = patients.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col relative">
      <header className="mb-8 flex-none flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Patient Directory</h2>
          <p className="text-slate-400 mt-2 text-lg">Comprehensive 360° view of synthetic patient records.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ firstName: '', lastName: '', age: 30, gender: 'Female', baselineRiskScore: 0.1 });
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2 bg-brand-teal text-white rounded-xl font-medium hover:bg-teal-500 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.3)] flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Patient</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 flex-none">
        <MetricCard 
          title="Total Active Patients"
          value={isLoading ? "--" : patients.length.toLocaleString()}
          trend="+12"
          isPositive={true}
          icon={User}
        />
        <MetricCard 
          title="High Risk (Score > 0.7)"
          value={isLoading ? "--" : highRiskCount.toString()}
          trend="+5"
          isPositive={false}
          icon={Activity}
        />
        <MetricCard 
          title="Flagged for Review"
          value="24"
          trend="-2"
          isPositive={true}
          icon={AlertCircle}
        />
      </div>

      <div className="flex-1 glass-card rounded-3xl overflow-hidden flex flex-col mb-6">
        <div className="p-6 border-b border-border-glass flex items-center justify-between bg-surface-glass">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-brand-teal" />
            <h3 className="text-xl font-bold">Patient Records</h3>
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-brand-teal/50 transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          {isLoading ? (
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              No patients found matching your search.
            </div>
          ) : (
            <table className="w-full text-left text-sm relative">
              <thead className="bg-slate-900/80 text-slate-400 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Patient Name</th>
                  <th className="px-6 py-4 font-medium">Age & Gender</th>
                  <th className="px-6 py-4 font-medium">Risk Assessment</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-glass">
                {filteredPatients.map((p) => (
                  <tr 
                    key={p.id} 
                    onClick={() => setSelectedPatient(p)}
                    className="hover:bg-brand-teal/5 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 text-slate-400">#{p.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white group-hover:text-brand-teal transition-colors">
                        {p.firstName} {p.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-300">{p.age} yrs</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.gender === 'Female' ? 'bg-brand-rose/20 text-brand-rose' :
                          p.gender === 'Male' ? 'bg-brand-indigo/20 text-brand-indigo' :
                          'bg-slate-500/20 text-slate-300'
                        }`}>
                          {p.gender}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${p.baselineRiskScore * 100}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={`h-full rounded-full ${
                              p.baselineRiskScore > 0.7 ? 'bg-brand-rose shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 
                              p.baselineRiskScore > 0.4 ? 'bg-brand-orange shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 
                              'bg-brand-teal shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                            }`}
                          />
                        </div>
                        <span className="text-slate-300 font-mono text-xs">{p.baselineRiskScore.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 group-hover:text-brand-teal group-hover:bg-brand-teal/10 rounded-full transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Patient 360 Modal Overlay */}
      <AnimatePresence>
        {selectedPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setSelectedPatient(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-surface-glass border border-border-glass shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border-glass flex items-start justify-between bg-gradient-to-r from-slate-900 to-slate-800">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-brand-teal/50 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                    <div className="flex items-center space-x-4 mt-2 text-slate-400 text-sm">
                      <span className="flex items-center space-x-1"><User className="w-4 h-4"/> <span>{selectedPatient.age} yrs • {selectedPatient.gender}</span></span>
                      <span className="flex items-center space-x-1"><Activity className="w-4 h-4"/> <span>ID: #{selectedPatient.id}</span></span>
                      <button onClick={() => openEditModal(selectedPatient)} className="ml-4 flex items-center space-x-1 text-brand-teal hover:text-teal-300 transition-colors">
                        <Edit className="w-3 h-3" /> <span>Edit Status</span>
                      </button>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                  <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
                    <h3 className="text-lg font-semibold mb-4 flex items-center"><FileHeart className="w-5 h-5 text-brand-teal mr-2" /> Clinical Summary</h3>
                    <p className="text-slate-300 leading-relaxed text-sm">
                      {selectedPatient.age} year old {selectedPatient.gender.toLowerCase()} admitted for routine observation. 
                      Baseline risk score is currently calculated at <span className="font-mono text-brand-teal">{selectedPatient.baselineRiskScore.toFixed(2)}</span>. 
                      No immediate critical alerts flagged by the GRC framework.
                    </p>
                    <button className="mt-4 w-full py-2 bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal rounded-xl border border-brand-teal/30 transition-colors flex items-center justify-center space-x-2 text-sm font-medium">
                      <Bot className="w-4 h-4" />
                      <span>Generate AI Discharge Summary</span>
                    </button>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
                    <h3 className="text-lg font-semibold mb-4 flex items-center"><Calendar className="w-5 h-5 text-brand-indigo mr-2" /> Recent Encounters</h3>
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex space-x-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-brand-indigo mt-1"></div>
                            {i === 1 && <div className="w-0.5 h-12 bg-slate-700 my-1"></div>}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">General Consultation</p>
                            <p className="text-xs text-slate-400 mt-1">Dr. Smith • Cardiology Dept • Oct {12 - i}, 2023</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-span-1 space-y-6">
                   <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 text-center">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Readmission Risk</h3>
                    <div className="relative w-32 h-32 mx-auto mt-4">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-800" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <motion.path 
                          className={selectedPatient.baselineRiskScore > 0.7 ? "text-brand-rose" : "text-brand-teal"}
                          strokeDasharray={`${selectedPatient.baselineRiskScore * 100}, 100`}
                          initial={{ strokeDasharray: "0, 100" }}
                          animate={{ strokeDasharray: `${selectedPatient.baselineRiskScore * 100}, 100` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold text-white">{(selectedPatient.baselineRiskScore * 100).toFixed(0)}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
                    <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center"><Pill className="w-4 h-4 mr-2"/> Active Meds</h3>
                    <ul className="space-y-3">
                      <li className="text-sm bg-slate-800/50 p-2 rounded-lg text-slate-300">Lisinopril 10mg</li>
                      <li className="text-sm bg-slate-800/50 p-2 rounded-lg text-slate-300">Atorvastatin 20mg</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Patient Modal */}
      <AnimatePresence>
        {(isAddModalOpen || isEditMode) && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md bg-surface-glass border border-border-glass shadow-2xl rounded-3xl overflow-hidden p-8"
            >
              <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Update Patient Status' : 'Add New Patient'}</h2>
              <form onSubmit={isEditMode ? handleEditSubmit : handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">First Name</label>
                    <input type="text" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full mt-1 bg-slate-900/50 border border-slate-700 rounded-xl py-2 px-3 text-white focus:border-brand-teal outline-none" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Last Name</label>
                    <input type="text" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full mt-1 bg-slate-900/50 border border-slate-700 rounded-xl py-2 px-3 text-white focus:border-brand-teal outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Age</label>
                    <input type="number" required value={formData.age} onChange={e => setFormData({...formData, age: parseInt(e.target.value)})} className="w-full mt-1 bg-slate-900/50 border border-slate-700 rounded-xl py-2 px-3 text-white focus:border-brand-teal outline-none" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full mt-1 bg-slate-900/50 border border-slate-700 rounded-xl py-2 px-3 text-white focus:border-brand-teal outline-none">
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                {isEditMode && (
                  <div>
                    <label className="text-sm text-slate-400">Baseline Risk Score (0.0 - 1.0)</label>
                    <input type="number" step="0.01" min="0" max="1" required value={formData.baselineRiskScore} onChange={e => setFormData({...formData, baselineRiskScore: parseFloat(e.target.value)})} className="w-full mt-1 bg-slate-900/50 border border-slate-700 rounded-xl py-2 px-3 text-white focus:border-brand-teal outline-none" />
                  </div>
                )}
                {!isEditMode && (
                  <div className="bg-brand-teal/10 border border-brand-teal/30 p-3 rounded-xl flex items-start space-x-3">
                    <Activity className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                    <p className="text-xs text-brand-teal/80 leading-relaxed">
                      The <strong className="text-brand-teal">Baseline Risk Score</strong> is a predictive metric usually generated by our ML models based on patient age and history. We will auto-calculate an initial score for you when you save!
                    </p>
                  </div>
                )}
                <div className="flex space-x-3 mt-8">
                  <button type="button" onClick={() => {setIsAddModalOpen(false); setIsEditMode(false);}} className="flex-1 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-brand-teal hover:bg-teal-500 text-white font-medium transition-colors">Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

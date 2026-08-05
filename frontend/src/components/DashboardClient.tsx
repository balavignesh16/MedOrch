"use client";

import React from 'react';
import { Users, Clock, AlertTriangle, Activity, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { useRouter } from 'next/navigation';
import GlobalQueryBar from './GlobalQueryBar';

// Placeholder for Recharts components (will be expanded in Sprint 2.2)

interface DashboardClientProps {
  initialData: {
    totalEncounters: number;
    avgTimeInHospital: string;
    readmissionRate: string;
    readmissionBreakdown: { readmitted: string; count: number }[];
    ageDistribution: { age_group: string; patient_count: number }[];
    medsByReadmission: { status: string; avg_meds: number }[];
  };
  currentFilter: string;
}

export default function DashboardClient({ initialData, currentFilter }: DashboardClientProps) {
  const router = useRouter();

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "All") {
      router.push('/');
    } else {
      router.push(`/?filter=${val}`);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <GlobalQueryBar />
        </div>
        <div className="mb-8 relative z-30">
           <div className="flex items-center gap-2 bg-[#0c121e] border border-slate-800 rounded-xl px-4 py-3 shadow-lg">
              <Filter className="w-4 h-4 text-brand-teal" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Gender:</span>
              <select 
                value={currentFilter}
                onChange={handleFilterChange}
                className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer appearance-none pr-4"
              >
                <option value="All" className="bg-slate-900">All Patients</option>
                <option value="Female" className="bg-slate-900">Female</option>
                <option value="Male" className="bg-slate-900">Male</option>
              </select>
           </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0c121e] border border-slate-800/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-teal/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="text-slate-400 text-xs uppercase tracking-[0.15em] font-bold">Total Encounters</div>
            <div className="p-2 bg-slate-800/50 rounded-lg"><Users className="w-4 h-4 text-brand-teal" /></div>
          </div>
          <div className="text-4xl font-light text-white tracking-tight">{initialData.totalEncounters.toLocaleString()}</div>
        </div>

        <div className="bg-[#0c121e] border border-slate-800/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-orange/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="text-slate-400 text-xs uppercase tracking-[0.15em] font-bold">Avg Readmission Rate</div>
            <div className="p-2 bg-slate-800/50 rounded-lg"><AlertTriangle className="w-4 h-4 text-brand-orange" /></div>
          </div>
          <div className="text-4xl font-light text-white tracking-tight">{initialData.readmissionRate}%</div>
        </div>

        <div className="bg-[#0c121e] border border-slate-800/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-cyan/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="text-slate-400 text-xs uppercase tracking-[0.15em] font-bold">Avg Hospital Stay</div>
            <div className="p-2 bg-slate-800/50 rounded-lg"><Clock className="w-4 h-4 text-brand-cyan" /></div>
          </div>
          <div className="text-4xl font-light text-white tracking-tight">{initialData.avgTimeInHospital} <span className="text-lg text-slate-500 font-normal">days</span></div>
        </div>

        <div className="bg-[#0c121e] border border-slate-800/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="text-slate-400 text-xs uppercase tracking-[0.15em] font-bold">AI Analysis Status</div>
            <div className="p-2 bg-slate-800/50 rounded-lg"><Activity className="w-4 h-4 text-purple-400" /></div>
          </div>
          <div className="text-xl font-bold text-purple-400 tracking-wide mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div> Grounded
          </div>
        </div>
      </div>

      {/* Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[450px]">
         {/* Chart 1: Age Demographics */}
         <div className="bg-[#0c121e] border border-slate-800/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute -top-[100px] -right-[100px] w-[400px] h-[400px] bg-brand-teal/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
            <h3 className="text-slate-400 font-bold mb-6 uppercase tracking-[0.2em] text-[10px]">Age Demographics Distribution</h3>
            <div className="flex-1 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={initialData.ageDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="age_group" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                    itemStyle={{ color: '#14b8a6', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="patient_count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {
                      initialData.ageDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#14b8a6" fillOpacity={0.8 + (index * 0.02)} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* Chart 2: Medications by Readmission Status */}
         <div className="bg-[#0c121e] border border-slate-800/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute -top-[100px] -right-[100px] w-[400px] h-[400px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
            <h3 className="text-slate-400 font-bold mb-6 uppercase tracking-[0.2em] text-[10px]">Avg Medications by Readmission Status</h3>
            <div className="flex-1 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={initialData.medsByReadmission} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="status" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                    itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="avg_meds" radius={[0, 6, 6, 0]} maxBarSize={40}>
                     {
                      initialData.medsByReadmission.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.status === '>30' ? '#f97316' : (entry.status === '<30' ? '#ef4444' : '#14b8a6')} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
}

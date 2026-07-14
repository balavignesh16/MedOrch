"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, Activity, BedDouble, Stethoscope } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import MetricCard from '@/components/MetricCard';

const predictionData = [
  { time: '00:00', admissions: 5, discharges: 2, icuDemand: 80 },
  { time: '04:00', admissions: 12, discharges: 5, icuDemand: 82 },
  { time: '08:00', admissions: 25, discharges: 15, icuDemand: 85 },
  { time: '12:00', admissions: 30, discharges: 20, icuDemand: 89 },
  { time: '16:00', admissions: 18, discharges: 22, icuDemand: 91 },
  { time: '20:00', admissions: 15, discharges: 10, icuDemand: 93 },
  { time: '24:00', admissions: 8, discharges: 4, icuDemand: 95 },
];

export default function ForecastPage() {
  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <header className="mb-4">
        <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-teal to-brand-indigo">Resource Forecast</h2>
        <p className="text-slate-400 mt-2 text-lg">AI-driven predictive modeling for hospital capacity and staffing.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Predicted ICU Peak" value="95%" trend="+5%" isPositive={false} icon={AlertCircle} />
        <MetricCard title="Est. Discharges" value="78" trend="+12" isPositive={true} icon={Activity} />
        <MetricCard title="Staffing Required" value="142" trend="Optimal" isPositive={true} icon={Stethoscope} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        {/* Admission vs Discharge Flow */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 flex flex-col"
        >
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="w-5 h-5 text-brand-teal" />
            <h3 className="text-lg font-semibold">24-Hour Patient Flow Prediction</h3>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDischarges" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="admissions" name="Expected Admissions" stroke="#06b6d4" fillOpacity={1} fill="url(#colorAdmissions)" />
                <Area type="monotone" dataKey="discharges" name="Expected Discharges" stroke="#10b981" fillOpacity={1} fill="url(#colorDischarges)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ICU Demand */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-3xl p-6 flex flex-col"
        >
          <div className="flex items-center space-x-2 mb-6">
            <BedDouble className="w-5 h-5 text-brand-rose" />
            <h3 className="text-lg font-semibold">ICU Capacity Strain Model</h3>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} domain={[60, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="icuDemand" name="ICU Demand %" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

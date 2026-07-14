"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, CalendarClock, AlertTriangle, Stethoscope } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const staffingData = [
  { department: 'ICU', required: 45, scheduled: 40, shortage: 5 },
  { department: 'ER', required: 60, scheduled: 58, shortage: 2 },
  { department: 'Surgery', required: 30, scheduled: 32, shortage: 0 },
  { department: 'Pediatrics', required: 25, scheduled: 25, shortage: 0 },
  { department: 'Cardiology', required: 35, scheduled: 30, shortage: 5 },
];

export default function StaffingPage() {
  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <header className="mb-4">
        <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-teal to-brand-indigo">Staffing & Resource Analytics</h2>
        <p className="text-slate-400 mt-2 text-lg">AI-powered workforce optimization and shift prediction.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Staff Scheduled" value="185" trend="+12" isPositive={true} icon={Users} />
        <MetricCard title="Current Shortfall" value="12" trend="-3" isPositive={false} icon={AlertTriangle} />
        <MetricCard title="Nurse:Patient Ratio" value="1:4.2" trend="Optimal" isPositive={true} icon={Stethoscope} />
        <MetricCard title="Avg Overtime Hours" value="4.5" trend="-1.2" isPositive={true} icon={CalendarClock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-2 glass-card rounded-3xl p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-brand-teal" />
              <h3 className="text-lg font-semibold">Departmental Staffing vs Requirements</h3>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="department" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                />
                <Legend />
                <Bar dataKey="required" name="Required Staff" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="scheduled" name="Scheduled Staff" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                  {staffingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.scheduled < entry.required ? '#f43f5e' : '#06b6d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Action Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-3xl p-6 flex flex-col"
        >
          <div className="flex items-center space-x-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-brand-rose" />
            <h3 className="text-lg font-semibold">AI Interventions</h3>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
            <div className="bg-brand-rose/10 border border-brand-rose/30 p-4 rounded-2xl">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-brand-rose text-sm">Critical ICU Shortage</span>
                <span className="text-xs text-brand-rose/60">Next Shift (18:00)</span>
              </div>
              <p className="text-sm text-slate-300 mb-4">Predicted shortfall of 5 nurses due to sudden influx of high-risk cardiac patients.</p>
              <button className="w-full py-2 bg-brand-rose/20 hover:bg-brand-rose/30 text-brand-rose rounded-xl text-sm font-medium transition-colors flex items-center justify-center">
                <UserPlus className="w-4 h-4 mr-2" /> Request Float Pool
              </button>
            </div>

            <div className="bg-brand-orange/10 border border-brand-orange/30 p-4 rounded-2xl">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-brand-orange text-sm">Cardiology Strain</span>
                <span className="text-xs text-brand-orange/60">Tomorrow (08:00)</span>
              </div>
              <p className="text-sm text-slate-300 mb-4">Resource Analytics agent predicts a 15% increase in admits based on predictive modeling.</p>
              <button className="w-full py-2 bg-brand-orange/20 hover:bg-brand-orange/30 text-brand-orange rounded-xl text-sm font-medium transition-colors flex items-center justify-center">
                <CalendarClock className="w-4 h-4 mr-2" /> Adjust Schedules
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

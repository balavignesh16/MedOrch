"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Bell, Map, AlertTriangle, ShieldCheck, Users, BedDouble, TrendingUp } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

const radarData = [
  { subject: 'Cardiac', A: 120, fullMark: 150 },
  { subject: 'Respiratory', A: 98, fullMark: 150 },
  { subject: 'Neurological', A: 86, fullMark: 150 },
  { subject: 'Orthopedic', A: 99, fullMark: 150 },
  { subject: 'Endocrine', A: 85, fullMark: 150 },
  { subject: 'Renal', A: 65, fullMark: 150 },
];

const areaData = [
  { name: 'Day 1', currentCapacity: 40, predictedLoad: 45 },
  { name: 'Day 5', currentCapacity: 45, predictedLoad: 50 },
  { name: 'Day 10', currentCapacity: 55, predictedLoad: 65 },
  { name: 'Day 15', currentCapacity: 60, predictedLoad: 75 },
  { name: 'Day 20', currentCapacity: 75, predictedLoad: 90 },
  { name: 'Day 25', currentCapacity: 80, predictedLoad: 95 },
  { name: 'Day 30', currentCapacity: 95, predictedLoad: 110 },
];

export default function Dashboard() {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'alert', message: 'ICU Capacity critically high (92%)', time: 'Just now' },
    { id: 2, type: 'info', message: 'New patient admitted to Ward B', time: '2m ago' },
    { id: 3, type: 'success', message: 'GRC Firewall blocked 3 PII leaks', time: '15m ago' },
  ]);

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col relative space-y-6">
      <header className="flex justify-between items-center mb-4 flex-none">
        <div>
          <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-teal to-brand-indigo">Command Center</h2>
          <p className="text-slate-400 mt-2 text-lg">Real-time Advanced Interactive Analytics.</p>
        </div>
        <div className="relative cursor-pointer group">
          <div className="absolute -inset-2 bg-brand-teal/20 rounded-full blur group-hover:bg-brand-teal/40 transition-colors" />
          <Bell className="w-8 h-8 text-brand-teal relative z-10" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-rose rounded-full border-2 border-slate-950 z-20 animate-pulse" />
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-none"
      >
        <MetricCard title="System Health" value="Optimal" trend="Secure" isPositive={true} icon={ShieldCheck} />
        <MetricCard title="Total Admits" value="1,243" trend="+12" isPositive={true} icon={Users} />
        <MetricCard title="Bed Occupancy" value="87%" trend="+5%" isPositive={false} icon={BedDouble} />
        <MetricCard title="Risk Score Avg" value="0.45" trend="-0.02" isPositive={true} icon={Activity} />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Radar Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-3xl p-6 flex flex-col"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-brand-indigo" />
            <h3 className="text-lg font-semibold">Population Risk Profile</h3>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fill: '#475569' }} />
                <Radar name="Risk Index" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Middle Column: Stacked Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-1 md:col-span-2 glass-card rounded-3xl p-6 flex flex-col"
        >
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-brand-teal" />
            <h3 className="text-lg font-semibold">30-Day Resource Forecasting</h3>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCapacity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                <Area type="monotone" dataKey="currentCapacity" stroke="#06b6d4" fillOpacity={1} fill="url(#colorCapacity)" />
                <Area type="monotone" dataKey="predictedLoad" stroke="#f43f5e" fillOpacity={1} fill="url(#colorLoad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Notifications Row */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-4 flex-none overflow-x-auto no-scrollbar flex space-x-4"
      >
        {notifications.map(n => (
          <div key={n.id} className={`flex items-center space-x-3 px-4 py-2 rounded-xl whitespace-nowrap border ${
            n.type === 'alert' ? 'bg-brand-rose/10 border-brand-rose/30 text-brand-rose' :
            n.type === 'success' ? 'bg-brand-teal/10 border-brand-teal/30 text-brand-teal' :
            'bg-brand-indigo/10 border-brand-indigo/30 text-brand-indigo'
          }`}>
            {n.type === 'alert' ? <AlertTriangle className="w-4 h-4" /> :
             n.type === 'success' ? <ShieldCheck className="w-4 h-4" /> :
             <Bell className="w-4 h-4" />}
            <span className="text-sm font-medium">{n.message}</span>
            <span className="text-xs opacity-60 ml-2">{n.time}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingDown, PieChart, Activity, AlertCircle } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Line, Legend } from 'recharts';

const financialData = [
  { month: 'Jan', revenue: 4000, expenses: 2400, penaltyRisk: 240 },
  { month: 'Feb', revenue: 3000, expenses: 1398, penaltyRisk: 2210 },
  { month: 'Mar', revenue: 2000, expenses: 9800, penaltyRisk: 2290 },
  { month: 'Apr', revenue: 2780, expenses: 3908, penaltyRisk: 2000 },
  { month: 'May', revenue: 1890, expenses: 4800, penaltyRisk: 2181 },
  { month: 'Jun', revenue: 2390, expenses: 3800, penaltyRisk: 2500 },
  { month: 'Jul', revenue: 3490, expenses: 4300, penaltyRisk: 2100 },
];

export default function FinancialsPage() {
  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <header className="mb-4">
        <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-teal to-brand-indigo">Health Economics & Financials</h2>
        <p className="text-slate-400 mt-2 text-lg">AI forecasting for revenue, burn rates, and readmission penalties.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Est. Readmission Penalties" value="$24,500" trend="-$1,200" isPositive={true} icon={AlertCircle} />
        <MetricCard title="Daily Revenue Burn" value="$142,000" trend="+$5,000" isPositive={false} icon={TrendingDown} />
        <MetricCard title="Optimized Savings" value="$86,400" trend="Optimal" isPositive={true} icon={DollarSign} />
        <MetricCard title="Claim Denial Rate" value="4.2%" trend="-0.5%" isPositive={true} icon={PieChart} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        {/* Revenue vs Expenses */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 flex flex-col"
        >
          <div className="flex items-center space-x-2 mb-6">
            <DollarSign className="w-5 h-5 text-brand-teal" />
            <h3 className="text-lg font-semibold">Revenue vs Operational Expenses</h3>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" barSize={20} fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e', strokeWidth: 2, r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Readmission Penalty Risk */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-3xl p-6 flex flex-col"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Activity className="w-5 h-5 text-brand-orange" />
            <h3 className="text-lg font-semibold">AI-Predicted CMS Penalty Risk</h3>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPenalty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="penaltyRisk" name="Penalty Risk Exposure" stroke="#f97316" fillOpacity={1} fill="url(#colorPenalty)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

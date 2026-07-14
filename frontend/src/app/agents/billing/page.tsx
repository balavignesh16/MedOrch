"use client";

import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { DollarSign, FileText, Activity, AlertTriangle, TrendingUp, ChevronDown } from 'lucide-react';
import MetricCard from '@/components/MetricCard';

const revenueData = [
  { month: 'Jan', revenue: 4200000, collections: 3800000 },
  { month: 'Feb', revenue: 4500000, collections: 4100000 },
  { month: 'Mar', revenue: 4100000, collections: 3600000 },
  { month: 'Apr', revenue: 4800000, collections: 4300000 },
  { month: 'May', revenue: 5100000, collections: 4600000 },
  { month: 'Jun', revenue: 4900000, collections: 4500000 },
  { month: 'Jul', revenue: 5300000, collections: 4900000 },
];

const denialReasons = [
  { reason: 'Missing Information', count: 145, amount: 250000 },
  { reason: 'Duplicate Claim', count: 89, amount: 120000 },
  { reason: 'Service Not Covered', count: 65, amount: 310000 },
  { reason: 'Coding Error', count: 42, amount: 85000 },
  { reason: 'Prior Auth Missing', count: 38, amount: 420000 },
];

export default function BillingDashboard() {
  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Financial Analytics</h2>
          <p className="text-slate-400 mt-2">Revenue Cycle Management & Claim Denial Analysis</p>
        </div>
        <div className="flex items-center gap-3 bg-surface-glass border border-border-glass backdrop-blur-md px-4 py-2 rounded-xl">
          <span className="text-sm text-slate-400">Period:</span>
          <button className="text-sm font-medium text-white flex items-center gap-1">
            Year to Date <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Total Revenue (YTD)" value="$32.9M" trend="+$2.4M" isPositive={true} icon={DollarSign} />
        <MetricCard title="Collection Rate" value="91.4%" trend="+1.2%" isPositive={true} icon={TrendingUp} />
        <MetricCard title="Claim Denial Rate" value="8.6%" trend="-0.5%" isPositive={true} icon={AlertTriangle} />
        <MetricCard title="Days in A/R" value="34 Days" trend="-2 Days" isPositive={true} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
        <div className="lg:col-span-2 bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6 shadow-lg h-full flex flex-col">
          <h3 className="text-slate-400 font-medium mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand-teal" /> Revenue vs Collections
          </h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#475569" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="revenue" name="Billed Revenue" stroke="#14b8a6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="collections" name="Actual Collections" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCollections)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6 shadow-lg h-full flex flex-col">
          <h3 className="text-slate-400 font-medium mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Top Denial Reasons
          </h3>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-2">
            {denialReasons.map((denial, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border-glass bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-200 text-sm">{denial.reason}</span>
                  <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                    {denial.count} claims
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Revenue Impact</span>
                  <span className="text-white font-mono">${denial.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full" 
                    style={{ width: `${(denial.amount / 500000) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

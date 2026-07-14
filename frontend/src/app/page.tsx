"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from '@/components/MetricCard';
import WardHeatmap from '@/components/WardHeatmap';
import { Activity, AlertTriangle, CheckCircle, Clock, Server, Zap, Users } from 'lucide-react';

const data = [
  { time: '00:00', admissions: 12, discharges: 8 },
  { time: '04:00', admissions: 18, discharges: 10 },
  { time: '08:00', admissions: 45, discharges: 22 },
  { time: '12:00', admissions: 30, discharges: 35 },
  { time: '16:00', admissions: 25, discharges: 40 },
  { time: '20:00', admissions: 15, discharges: 18 },
  { time: '24:00', admissions: 10, discharges: 12 },
];


export default function Home() {
  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Global Command Center
            <span className="px-2 py-1 rounded-md bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs uppercase tracking-widest font-mono">Live</span>
          </h2>
          <p className="text-slate-400 mt-2">Real-time overview of MedOrch clinical metrics and systems.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">System Status</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-brand-teal animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.8)]"></div>
            <span className="text-sm font-medium text-brand-teal">All Systems Operational</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard title="Active Patients" value="1,243" trend="+5" isPositive={false} icon={Users} />
        <MetricCard title="ICU Bed Capacity" value="82%" trend="Warning" isPositive={false} icon={Activity} />
        <MetricCard title="Avg Readmission Risk" value="14.5%" trend="-1.2%" isPositive={true} icon={AlertTriangle} />
        <MetricCard title="Staffing Efficiency" value="94%" trend="+2%" isPositive={true} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 h-96">
        <div className="lg:col-span-2 bg-surface-obsidian border border-border-glass rounded-xl p-6 shadow-2xl relative overflow-hidden flex flex-col">
          {/* Subtle background glow */}
          <div className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] bg-brand-teal/5 rounded-full blur-[80px] pointer-events-none"></div>
          
          <h3 className="text-slate-400 font-medium mb-6 uppercase tracking-wider text-xs">Hospital Activity (24h)</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDischarges" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="admissions" stroke="#14b8a6" fillOpacity={1} fill="url(#colorAdmissions)" strokeWidth={2} />
                <Area type="monotone" dataKey="discharges" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorDischarges)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="h-full">
          <WardHeatmap />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Architecture Status */}
        <div className="col-span-1 bg-surface-obsidian border border-border-glass rounded-xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -bottom-[50px] -left-[50px] w-[200px] h-[200px] bg-brand-cyan/5 rounded-full blur-[60px] pointer-events-none"></div>
          <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
            <Server className="w-4 h-4 text-brand-cyan" /> Architecture Status
          </h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-border-glass bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" />
                <span className="text-sm font-medium text-slate-300">Next.js Frontend</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">Port 3000</span>
            </div>
            <div className="p-3 rounded-lg border border-border-glass bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" />
                <span className="text-sm font-medium text-slate-300">Go API Gateway</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">gRPC :50051</span>
            </div>
            <div className="p-3 rounded-lg border border-border-glass bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" />
                <span className="text-sm font-medium text-slate-300">Python AI Engine</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">gRPC :50052</span>
            </div>
            <div className="p-3 rounded-lg border border-brand-teal/20 bg-brand-teal/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-brand-teal" />
                <span className="text-sm font-medium text-brand-teal">LLM Engine</span>
              </div>
              <span className="text-xs text-brand-teal font-mono uppercase tracking-widest">NVIDIA NIM</span>
            </div>
          </div>
        </div>

        {/* Live Alerts Feed */}
        <div className="col-span-2 bg-surface-obsidian border border-border-glass rounded-xl p-6 shadow-2xl flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-brand-orange" /> Clinical Alerts Feed
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {[ 
              { time: "10:42 AM", title: "ICU Capacity Warning", desc: "Cardiology ICU has reached 90% capacity.", type: "warning" },
              { time: "10:15 AM", title: "Compliance Scan Passed", desc: "Daily HIPAA automated scan completed with 0 violations.", type: "success" },
              { time: "09:30 AM", title: "Staffing Shortage", desc: "ER triage wait times exceeding 45 minutes due to nurse shortage.", type: "warning" },
              { time: "08:00 AM", title: "System Backup", desc: "Nightly PostgreSQL database backup completed successfully.", type: "success" },
            ].map((alert, i) => (
              <div key={i} className="p-3 rounded-lg border border-border-glass bg-white/[0.02] flex gap-4 items-start hover:bg-white/[0.04] transition-colors">
                <div className="mt-0.5">
                  {alert.type === 'warning' ? 
                    <AlertTriangle className="w-4 h-4 text-brand-orange drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]" /> :
                    <CheckCircle className="w-4 h-4 text-brand-teal drop-shadow-[0_0_5px_rgba(20,184,166,0.5)]" />
                  }
                </div>
                <div className="flex-1">
                  <h4 className="text-sm text-slate-200 font-medium">{alert.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{alert.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                  <Clock className="w-3 h-3" />
                  {alert.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

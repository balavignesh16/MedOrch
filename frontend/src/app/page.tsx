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
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Global Command Center</h2>
        <p className="text-slate-400 mt-2">Real-time overview of MedOrch microservices and clinical metrics.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Active Patients" value="1,243" trend="+5" isPositive={false} icon={Users} />
        <MetricCard title="ICU Bed Capacity" value="82%" trend="Warning" isPositive={false} icon={Activity} />
        <MetricCard title="Avg Readmission Risk" value="14.5%" trend="-1.2%" isPositive={true} icon={AlertTriangle} />
        <MetricCard title="Staffing Efficiency" value="94%" trend="+2%" isPositive={true} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-96">
        <div className="lg:col-span-2 bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6 shadow-lg h-full flex flex-col">
          <h3 className="text-slate-400 font-medium mb-6">Hospital Activity (24h)</h3>
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

      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Architecture Status */}
        <div className="col-span-1 bg-surface-glass border border-border-glass backdrop-blur-md rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Server className="w-5 h-5 text-brand-teal" /> Architecture Status
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border-glass bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium text-slate-200">Next.js Frontend</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">Port 3000</span>
            </div>
            <div className="p-4 rounded-xl border border-border-glass bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium text-slate-200">Go API Gateway</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">gRPC :50051</span>
            </div>
            <div className="p-4 rounded-xl border border-border-glass bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium text-slate-200">Python LangGraph</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">gRPC :50052</span>
            </div>
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-amber-200">LLM Engine</span>
              </div>
              <span className="text-xs text-amber-500 font-mono">Mock Mode</span>
            </div>
          </div>
        </div>

        {/* Live Alerts Feed */}
        <div className="col-span-2 bg-surface-glass border border-border-glass backdrop-blur-md rounded-2xl p-6 shadow-lg flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Clinical Alerts Feed
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {[ 
              { time: "10:42 AM", title: "ICU Capacity Warning", desc: "Cardiology ICU has reached 90% capacity.", type: "warning" },
              { time: "10:15 AM", title: "Compliance Scan Passed", desc: "Daily HIPAA automated scan completed with 0 violations.", type: "success" },
              { time: "09:30 AM", title: "Staffing Shortage", desc: "ER triage wait times exceeding 45 minutes due to nurse shortage.", type: "warning" },
              { time: "08:00 AM", title: "System Backup", desc: "Nightly PostgreSQL database backup completed successfully.", type: "success" },
            ].map((alert, i) => (
              <div key={i} className="p-4 rounded-xl border border-border-glass bg-white/5 flex gap-4 items-start hover:bg-white/10 transition-colors">
                <div className="mt-1">
                  {alert.type === 'warning' ? 
                    <AlertTriangle className="w-5 h-5 text-amber-500" /> :
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  }
                </div>
                <div className="flex-1">
                  <h4 className="text-slate-200 font-medium">{alert.title}</h4>
                  <p className="text-sm text-slate-400 mt-1">{alert.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
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

"use client";

import MetricCard from '@/components/MetricCard';
import { Activity, AlertTriangle, CheckCircle, Clock, Server, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Global Command Center</h2>
        <p className="text-slate-400 mt-2">Real-time overview of MedOrch microservices and clinical metrics.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Active Patients" value="1,243" trend="+5" isPositive={false} />
        <MetricCard title="ICU Bed Capacity" value="82%" trend="Warning" isPositive={false} />
        <MetricCard title="Avg Readmission Risk" value="14.5%" trend="-1.2%" isPositive={true} />
        <MetricCard title="Staffing Efficiency" value="94%" trend="+2%" isPositive={true} />
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

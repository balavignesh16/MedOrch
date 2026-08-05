"use client";

import MetricCard from '@/components/MetricCard';
import { Activity, AlertTriangle, CheckCircle, Clock, Users, Building, Thermometer, ShieldAlert } from 'lucide-react';
import GlobalQueryBar from '@/components/GlobalQueryBar';

export default function OperationsDashboardClient({ metrics }: { metrics: any }) {
  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2 py-1 rounded-md bg-brand-orange/10 border border-brand-orange/30 text-brand-orange text-[10px] uppercase tracking-[0.2em] font-bold shadow-[0_0_10px_rgba(249,115,22,0.2)]">
              Live Operations
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-semibold">MedOrch OS</span>
          </div>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tighter">
            Live Hospital Status
          </h2>
          <p className="text-slate-500 mt-2 font-mono text-sm">Real-time ground truth metrics fetched directly from MedOrch SQL Database.</p>
        </div>
        <div className="text-right bg-white border border-slate-200 rounded-2xl p-4 shadow-sm backdrop-blur-md">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Database Connection</p>
          <div className="flex items-center justify-end gap-2 mt-2">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse shadow-[0_0_10px_rgba(249,115,22,1)]"></div>
            <span className="text-sm font-bold text-brand-orange tracking-wide">SQLITE: SYNced</span>
          </div>
        </div>
      </header>

      <GlobalQueryBar injectedContext={`Currently, the hospital has ${metrics.activeAdmissions} active patients, ${metrics.totalStaff} active staff on shift, and an average readmission risk of ${metrics.avgRiskScore}%.`} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Active Admissions" value={metrics.activeAdmissions.toString()} trend="Live" isPositive={false} icon={Building} />
        <MetricCard title="Avg Readmission Risk" value={`${metrics.avgRiskScore}%`} trend="Live" isPositive={false} icon={AlertTriangle} />
        <MetricCard title="Staff on Shift" value={metrics.totalStaff.toString()} trend="Live" isPositive={true} icon={Users} />
        <MetricCard title="Total Departments" value={metrics.deptWorkload.length.toString()} trend="Active" isPositive={true} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 flex-1 min-h-[400px]">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col">
          <div className="absolute -top-[100px] -right-[100px] w-[400px] h-[400px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply"></div>
          
          <h3 className="text-slate-500 font-bold mb-6 uppercase tracking-[0.2em] text-[10px]">Live Department Workload</h3>
          <div className="flex-1 min-h-0 relative z-10">
            <div className="space-y-4">
              {metrics.deptWorkload.map((dept: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-bold text-slate-700 tracking-wide">{dept.name}</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-orange"
                      style={{ width: `${(dept.active_patients / metrics.activeAdmissions) * 100}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-xs font-mono text-slate-500">{dept.active_patients} pts</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Alerts Feed */}
        <div className="col-span-1 bg-white border border-slate-200 rounded-3xl p-8 shadow-xl flex flex-col">
          <h3 className="text-[10px] font-bold text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-[0.2em]">
            <ShieldAlert className="w-4 h-4 text-brand-orange" /> Live Operations Alerts
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
            {metrics.alerts.map((alert: any) => (
              <div key={alert.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex gap-4 items-start hover:bg-slate-100 transition-colors">
                <div className="mt-1">
                  {alert.type === 'warning' ? 
                    <AlertTriangle className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_4px_rgba(234,179,8,0.4)]" /> :
                   alert.type === 'critical' ?
                    <ShieldAlert className="w-5 h-5 text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.4)]" /> :
                    <CheckCircle className="w-5 h-5 text-brand-teal drop-shadow-[0_0_4px_rgba(20,184,166,0.4)]" />
                  }
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-slate-700 font-medium leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

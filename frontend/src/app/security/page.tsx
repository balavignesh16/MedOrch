"use client";

import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Lock, Eye, AlertTriangle } from 'lucide-react';
import MetricCard from '@/components/MetricCard';

const auditLogs = [
  { id: 'AL-9023', timestamp: '2026-07-14T10:45:12Z', user: 'admin', agent: 'Cyber GRC', action: 'PII_SCRUBBED', details: 'Detected and redacted [SSN] pattern in patient discharge summary.', status: 'blocked' },
  { id: 'AL-9022', timestamp: '2026-07-14T10:42:05Z', user: 'admin', agent: 'Orchestrator', action: 'QUERY_ROUTING', details: 'Routed query to Health Economics agent.', status: 'allowed' },
  { id: 'AL-9021', timestamp: '2026-07-14T10:35:19Z', user: 'admin', agent: 'Cyber GRC', action: 'PII_SCRUBBED', details: 'Redacted [PHONE_NUMBER] from query payload.', status: 'blocked' },
  { id: 'AL-9020', timestamp: '2026-07-14T09:15:00Z', user: 'system', agent: 'Predictive Risk', action: 'BULK_ANALYSIS', details: 'Processed daily risk score recalculation for 142 patients.', status: 'allowed' },
  { id: 'AL-9019', timestamp: '2026-07-14T08:50:22Z', user: 'admin', agent: 'Cyber GRC', action: 'ACCESS_DENIED', details: 'Attempted to query restricted billing records.', status: 'denied' },
];

export default function SecurityPage() {
  const [filter, setFilter] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    if (filter === 'blocked') return log.status === 'blocked' || log.status === 'denied';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col space-y-6">
      <header className="mb-4">
        <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-teal to-brand-indigo">Cyber GRC & Audit Log</h2>
        <p className="text-slate-400 mt-2 text-lg">Real-time monitoring of AI interactions, PII scrubbing, and HIPAA compliance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Queries Scanned" value="1,492" trend="+142" isPositive={true} icon={Eye} />
        <MetricCard title="PII Violations Blocked" value="28" trend="+3" isPositive={false} icon={ShieldAlert} />
        <MetricCard title="HIPAA Compliance" value="99.9%" trend="Optimal" isPositive={true} icon={ShieldCheck} />
        <MetricCard title="Active Threats" value="0" trend="Clear" isPositive={true} icon={Lock} />
      </div>

      <div className="flex-1 glass-card rounded-3xl p-6 flex flex-col min-h-[400px]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-brand-teal" />
            <h3 className="text-lg font-semibold">Live Security Audit Log</h3>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-brand-teal text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              All Events
            </button>
            <button 
              onClick={() => setFilter('blocked')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center ${filter === 'blocked' ? 'bg-brand-rose text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Blocked/Redacted
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar relative border border-slate-700/50 rounded-2xl">
          <table className="w-full text-left text-sm relative">
            <thead className="bg-slate-900/80 text-slate-400 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-medium">Log ID</th>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Agent Node</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-glass">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{log.id}</td>
                  <td className="px-6 py-4 text-slate-300">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-800 rounded-full text-xs font-medium text-slate-300 border border-slate-700">
                      {log.agent}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex inline-flex items-center space-x-1 ${
                      log.status === 'blocked' || log.status === 'denied' 
                        ? 'bg-brand-rose/20 text-brand-rose border border-brand-rose/30'
                        : 'bg-brand-teal/20 text-brand-teal border border-brand-teal/30'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

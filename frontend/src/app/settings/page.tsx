import React from 'react';
import { Settings as SettingsIcon, Shield, Database, Server } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">System Settings</h2>
        <p className="text-slate-400 mt-2">Configure AI parameters, gateway connections, and security protocols.</p>
      </header>

      <div className="space-y-6">
        <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Server className="w-6 h-6 text-brand-teal" />
            <h3 className="text-xl font-bold">API Gateway Configuration</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Gateway URL (HTTP Proxy)</label>
              <input type="text" disabled value="http://localhost:8080/api/query" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-4 text-slate-300 opacity-70" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Internal Python gRPC Host</label>
              <input type="text" disabled value="localhost:50051" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-4 text-slate-300 opacity-70" />
            </div>
          </div>
        </div>

        <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-brand-teal" />
            <h3 className="text-xl font-bold">GRC Security Firewall</h3>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div>
              <p className="font-medium text-white">PII Regex Scrubbing</p>
              <p className="text-sm text-slate-400">Actively redacting SSNs and identifiable data from LLM outputs.</p>
            </div>
            <div className="w-12 h-6 bg-brand-teal rounded-full relative shadow-[0_0_10px_rgba(13,148,136,0.5)]">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-6 h-6 text-brand-teal" />
            <h3 className="text-xl font-bold">Vector Database (Qdrant)</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Qdrant Host URL</label>
              <input type="text" disabled value="http://localhost:6333" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-4 text-slate-300 opacity-70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

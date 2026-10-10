import React from 'react';
import { CommandPalette } from '@/components/ui/command-palette';
import { ShieldCheck, Calendar } from 'lucide-react';

export default function QualityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <CommandPalette />
      
      {/* Dashboard Header */}
      <header className="bg-surface-obsidian/80 backdrop-blur-xl border-b border-border-glass sticky top-0 z-40">
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-purple to-brand-cyan p-[1px] shadow-[0_0_20px_rgba(20,184,166,0.15)]">
              <div className="h-full w-full bg-surface-obsidian rounded-[11px] flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-cyan" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Clinical Quality Dashboard
              </h1>
              <p className="text-sm text-white/50 font-medium">
                Monitor readmissions, safety metrics, and clinical risks
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-surface-black border border-border-glass rounded-lg px-4 py-2 flex items-center gap-3 shadow-inner">
              <Calendar className="h-4 w-4 text-brand-cyan/50" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Period</span>
                <span className="text-sm font-medium text-white/90">Q3 2026 (Live)</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

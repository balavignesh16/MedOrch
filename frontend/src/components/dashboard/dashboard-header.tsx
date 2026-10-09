import React from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Bell, User, Search, Settings } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  showDatePicker?: boolean;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <>
      <header className="mb-8 relative z-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Breadcrumb 
            items={[
              { label: 'MedOrch', href: '/' },
              { label: title }
            ]}
          />
          <div className="flex items-center space-x-3 bg-surface-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-sm">
            <div className="relative group cursor-pointer hover:bg-white/5 rounded-xl px-3 py-1.5 transition-colors flex items-center gap-2 border border-transparent hover:border-white/5">
              <Search className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors" />
              <span className="text-xs text-white/50 group-hover:text-white transition-colors font-medium">Search</span>
              <kbd className="hidden sm:inline-block font-mono text-[10px] bg-white/10 text-white/50 rounded px-1.5 py-0.5 ml-2">⌘K</kbd>
            </div>
            
            <div className="w-px h-6 bg-white/10"></div>
            
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-white/70">Seattle General</span>
            </div>
            
            <div className="w-px h-6 bg-white/10 hidden md:block"></div>
            
            <div className="flex items-center space-x-1 px-1">
              <button className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white relative group">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-orange rounded-full border border-surface-black"></span>
              </button>
              <button className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white hidden sm:block">
                <Settings className="h-4 w-4" />
              </button>
              <button className="p-2 ml-1 bg-gradient-to-br from-brand-teal to-brand-cyan rounded-xl shadow-sm hover:shadow-[0_0_15px_rgba(45,212,191,0.5)] transition-all text-white">
                <User className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-2">{title}</h1>
          {description && (
            <p className="text-sm md:text-base text-white/50 max-w-3xl font-medium leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {/* Optional decorative element per page header */}
        <div className="absolute -left-8 -top-8 w-32 h-32 bg-brand-teal/10 rounded-full blur-[40px] pointer-events-none mix-blend-screen"></div>
      </div>
    </>
  );
}

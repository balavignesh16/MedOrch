'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette Modal */}
      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-surface-obsidian border border-border-glass shadow-2xl transition-all">
        <div className="flex items-center border-b border-border-glass px-4 py-3">
          <Search className="h-5 w-5 text-brand-teal opacity-70" />
          <input
            type="text"
            className="flex-1 bg-transparent px-4 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none"
            placeholder="Search KPIs, Patients, Modules..."
            autoFocus
          />
          <button onClick={() => setIsOpen(false)} className="text-foreground/50 hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2 mt-2">
            Recent Pages
          </div>
          <ul className="space-y-1 mb-6">
            <li className="px-3 py-2 hover:bg-surface-glass-hover rounded-md cursor-pointer flex items-center text-sm text-foreground/80 transition-colors">
              <span className="w-2 h-2 rounded-full bg-brand-teal mr-3"></span>
              Executive Command Center
            </li>
            <li className="px-3 py-2 hover:bg-surface-glass-hover rounded-md cursor-pointer flex items-center text-sm text-foreground/80 transition-colors">
              <span className="w-2 h-2 rounded-full bg-brand-cyan mr-3"></span>
              Population Health
            </li>
          </ul>

          <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">
            Quick Actions
          </div>
          <ul className="space-y-1 mb-6">
            <li className="px-3 py-2 hover:bg-surface-glass-hover rounded-md cursor-pointer flex items-center text-sm text-foreground/80 transition-colors">
              <span className="border border-border-glass rounded px-1.5 py-0.5 text-xs mr-3 font-mono">+</span>
              Create New Report
            </li>
            <li className="px-3 py-2 hover:bg-surface-glass-hover rounded-md cursor-pointer flex items-center text-sm text-foreground/80 transition-colors">
              <span className="border border-border-glass rounded px-1.5 py-0.5 text-xs mr-3 font-mono">@</span>
              Mention Clinical Team
            </li>
          </ul>

          <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">
            Categories
          </div>
          <ul className="space-y-1">
            <li className="px-3 py-2 hover:bg-surface-glass-hover rounded-md cursor-pointer flex items-center text-sm text-foreground/80 transition-colors">
              Clinical Quality KPIs
            </li>
            <li className="px-3 py-2 hover:bg-surface-glass-hover rounded-md cursor-pointer flex items-center text-sm text-foreground/80 transition-colors">
              Financial Operations
            </li>
            <li className="px-3 py-2 hover:bg-surface-glass-hover rounded-md cursor-pointer flex items-center text-sm text-foreground/80 transition-colors">
              System Health Alerts
            </li>
          </ul>
        </div>

        <div className="bg-surface-glass border-t border-border-glass px-4 py-3 text-xs text-foreground/50 flex flex-wrap gap-4">
          <div className="flex items-center space-x-1">
            <kbd className="bg-white/10 px-1 rounded font-mono">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="bg-white/10 px-1 rounded font-mono">Enter</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="bg-white/10 px-1 rounded font-mono">Tab</kbd>
            <span>Quick Action</span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="bg-white/10 px-1 rounded font-mono">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

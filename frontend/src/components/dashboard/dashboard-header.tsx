import React from 'react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Bell, Moon, User } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  showDatePicker?: boolean;
}

export function DashboardHeader({ title, description, showDatePicker = true }: DashboardHeaderProps) {
  return (
    <>
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <Breadcrumb 
            items={[
              { label: 'MedOrch', href: '/' },
              { label: title }
            ]}
          />
          <div className="flex items-center space-x-6">
            <div className="text-xs text-brand-teal/80 border border-brand-teal/20 rounded px-2 py-1 flex items-center gap-1 bg-brand-teal/5">
              <span>Search</span>
              <kbd className="font-mono font-semibold bg-white/10 rounded px-1">Ctrl K</kbd>
            </div>
            <div className="flex items-center space-x-4 text-white/50 border-l border-white/10 pl-4">
              <div className="text-xs flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Seattle General</span>
              </div>
              <div className="text-xs hidden md:block">
                Last Updated: Just now
              </div>
              <button className="hover:text-white transition-colors"><Bell className="h-4 w-4" /></button>
              <button className="hover:text-white transition-colors"><Moon className="h-4 w-4" /></button>
              <button className="hover:text-white transition-colors bg-white/10 p-1 rounded-full"><User className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
          {description && (
            <p className="text-white/60 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import React from 'react';
import { User, Activity, AlertCircle } from 'lucide-react';
import MetricCard from '@/components/MetricCard';

export default function Patients() {
  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Patient Directory</h2>
        <p className="text-slate-400 mt-2">Manage and view synthetic patient records securely.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard 
          title="Total Active Patients"
          value="1,243"
          trend="+12"
          isPositive={true}
          icon={User}
        />
        <MetricCard 
          title="High Risk (Cardiac)"
          value="87"
          trend="+5"
          isPositive={false}
          icon={Activity}
        />
        <MetricCard 
          title="Flagged for Review"
          value="24"
          trend="-2"
          isPositive={true}
          icon={AlertCircle}
        />
      </div>

      <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6 shadow-lg h-96 flex flex-col items-center justify-center">
        <User className="w-16 h-16 text-slate-500 mb-4 opacity-50" />
        <h3 className="text-xl font-bold mb-2">Patient Records Database</h3>
        <p className="text-slate-400 text-center max-w-md">
          This view will connect directly to our PostgreSQL database to display sortable and searchable patient records. (Phase 3)
        </p>
      </div>
    </div>
  );
}

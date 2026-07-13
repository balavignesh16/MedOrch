"use client";

import React, { useState } from 'react';
import MetricCard from '@/components/MetricCard';
import CommandBar from '@/components/CommandBar';
import { TrendingUp, Users, Activity, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  // Default empty state before any query is made
  const [metrics, setMetrics] = useState<any>(null);
  const [insightSummary, setInsightSummary] = useState<string>("[ LLM generated summary will appear here after gRPC pipeline is connected ]");

  const handleQueryResult = (result: any) => {
    if (result.data && result.data.metrics) {
      setMetrics(result.data.metrics);
    }
    if (result.summaryText) {
      setInsightSummary(result.summaryText);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-2">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">System Overview</h2>
        <p className="text-slate-400 mt-2">Real-time metrics from the predictive engine.</p>
      </header>

      <CommandBar onResult={handleQueryResult} />

      {metrics ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <MetricCard 
            title="Readmission Risk"
            value={metrics.readmission_risk.value}
            trend={metrics.readmission_risk.trend}
            isPositive={metrics.readmission_risk.isPositive}
            icon={Activity}
          />
          <MetricCard 
            title="Active Patients"
            value={metrics.active_patients.value}
            trend={metrics.active_patients.trend}
            isPositive={metrics.active_patients.isPositive}
            icon={Users}
          />
          <MetricCard 
            title="ICU Capacity"
            value={metrics.icu_capacity.value}
            trend={metrics.icu_capacity.trend}
            isPositive={metrics.icu_capacity.isPositive}
            icon={TrendingUp}
          />
          <MetricCard 
            title="Est. Cost Impact"
            value={metrics.cost_impact.value}
            trend={metrics.cost_impact.trend}
            isPositive={metrics.cost_impact.isPositive}
            icon={DollarSign}
          />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6 h-32 flex items-center justify-center animate-pulse">
               <p className="text-slate-600 text-sm">Awaiting Query...</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6 shadow-lg h-96 flex items-center justify-center">
          <p className="text-slate-500 italic">[ D3.js Chart Area - Awaiting Data ]</p>
        </div>
        <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6 shadow-lg h-96 flex flex-col">
          <h3 className="text-lg font-bold mb-4">Recent AI Insights</h3>
          <div className="flex-1 flex items-center justify-center">
             <p className="text-slate-300 text-center text-sm px-4">
               {insightSummary}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

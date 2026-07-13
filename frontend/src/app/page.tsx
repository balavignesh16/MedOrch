"use client";

import React from 'react';
import MetricCard from '@/components/MetricCard';
import { TrendingUp, Users, Activity, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  // Mock data representing the gRPC payload from Dev A
  const mockData = {
    readmission_risk: {
      value: '15.2%',
      trend: '+1.4%',
      isPositive: false,
    },
    active_patients: {
      value: 1243,
      trend: '-5',
      isPositive: true,
    },
    icu_capacity: {
      value: '82%',
      trend: 'Warning',
      isPositive: false,
    },
    cost_impact: {
      value: '$45,000',
      trend: '-$2,100',
      isPositive: true,
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">System Overview</h2>
        <p className="text-slate-400 mt-2">Real-time metrics from the predictive engine.</p>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <MetricCard 
          title="Readmission Risk"
          value={mockData.readmission_risk.value}
          trend={mockData.readmission_risk.trend}
          isPositive={mockData.readmission_risk.isPositive}
          icon={Activity}
        />
        <MetricCard 
          title="Active Patients"
          value={mockData.active_patients.value}
          trend={mockData.active_patients.trend}
          isPositive={mockData.active_patients.isPositive}
          icon={Users}
        />
        <MetricCard 
          title="ICU Capacity"
          value={mockData.icu_capacity.value}
          trend={mockData.icu_capacity.trend}
          isPositive={mockData.icu_capacity.isPositive}
          icon={TrendingUp}
        />
        <MetricCard 
          title="Est. Cost Impact"
          value={mockData.cost_impact.value}
          trend={mockData.cost_impact.trend}
          isPositive={mockData.cost_impact.isPositive}
          icon={DollarSign}
        />
      </motion.div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6 shadow-lg h-96 flex items-center justify-center">
          <p className="text-slate-500 italic">[ D3.js Chart Area - Awaiting Data ]</p>
        </div>
        <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6 shadow-lg h-96 flex flex-col">
          <h3 className="text-lg font-bold mb-4">Recent AI Insights</h3>
          <div className="flex-1 flex items-center justify-center">
             <p className="text-slate-500 italic text-center text-sm px-4">
               [ LLM generated summary will appear here after gRPC pipeline is connected ]
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import MetricCard from '@/components/MetricCard';
import { TrendingUp, Users, Activity, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import CommandBar from '@/components/CommandBar';

// Initial Mock Data Structure
const initialMockData = {
  readmission_risk: { value: '--', trend: '--', isPositive: true },
  active_patients: { value: '--', trend: '--', isPositive: true },
  icu_capacity: { value: '--', trend: '--', isPositive: true },
  cost_impact: { value: '--', trend: '--', isPositive: true }
};

export default function Home() {
  const [data, setData] = useState(initialMockData);
  const [summary, setSummary] = useState("[ LLM generated summary will appear here after gRPC pipeline is connected ]");
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuerySubmit = async (query: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8080/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: query }),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update state with live data
      setSummary(result.summary || "No summary provided.");
      if (result.metrics) {
        setChartData(result.metrics);
        // We could also map metrics to the cards here if they were provided in that format
        // For now we'll just populate the chart area with the raw JSON for Phase 3 visualization
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-2">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">System Overview</h2>
        <p className="text-slate-400 mt-2">Real-time metrics from the predictive engine.</p>
      </header>

      <CommandBar onQuerySubmit={handleQuerySubmit} isLoading={isLoading} />
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <MetricCard 
          title="Readmission Risk"
          value={data.readmission_risk.value}
          trend={data.readmission_risk.trend}
          isPositive={data.readmission_risk.isPositive}
          icon={Activity}
        />
        <MetricCard 
          title="Active Patients"
          value={data.active_patients.value}
          trend={data.active_patients.trend}
          isPositive={data.active_patients.isPositive}
          icon={Users}
        />
        <MetricCard 
          title="ICU Capacity"
          value={data.icu_capacity.value}
          trend={data.icu_capacity.trend}
          isPositive={data.icu_capacity.isPositive}
          icon={TrendingUp}
        />
        <MetricCard 
          title="Est. Cost Impact"
          value={data.cost_impact.value}
          trend={data.cost_impact.trend}
          isPositive={data.cost_impact.isPositive}
          icon={DollarSign}
        />
      </motion.div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6 shadow-lg h-96 flex flex-col">
          <h3 className="text-lg font-bold mb-4">Live Data Feed (Pre-D3)</h3>
          <div className="flex-1 overflow-auto bg-slate-900/50 rounded-lg p-4 font-mono text-sm">
            {chartData ? (
              <pre className="text-teal-400">{JSON.stringify(chartData, null, 2)}</pre>
            ) : (
              <p className="text-slate-500 italic h-full flex items-center justify-center">[ D3.js Chart Area - Awaiting Data ]</p>
            )}
          </div>
        </div>
        <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6 shadow-lg h-96 flex flex-col">
          <h3 className="text-lg font-bold mb-4">Recent AI Insights</h3>
          <div className="flex-1 overflow-auto">
             <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
               {summary}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

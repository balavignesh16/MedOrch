import React from 'react';
import type { fetchEnterpriseBenchmarkProfiles } from '@/lib/strategyLogic';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Target } from 'lucide-react';

interface EnterpriseBenchmarkProfilesProps {
  data: Awaited<ReturnType<typeof fetchEnterpriseBenchmarkProfiles>>;
}

export function EnterpriseBenchmarkProfiles({ data }: EnterpriseBenchmarkProfilesProps) {
  return (
    <div className="bg-surface-glass border border-border-glass rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-base font-semibold text-white flex items-center">
          <Target className="w-5 h-5 mr-2 text-brand-teal" />
          Enterprise Benchmark Profiles
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider font-bold text-brand-teal bg-brand-teal/10 px-2 py-1 rounded-full">
            Strategic Benchmarking Model (Analytical)
          </span>
        </div>
      </div>

      <div className="h-[350px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="metric" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
            <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} domain={[0, 100]} />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="current" name="Current Performance" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="target" name="Internal Target" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="bestPractice" name="Best Practice" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="industry" name="Industry Avg" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

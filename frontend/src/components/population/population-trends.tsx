'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TrendData {
  name: string;
  admissions: number;
  readmissions: number;
  avg_los: number;
}

interface PopulationTrendsProps {
  data: TrendData[];
}

export function PopulationTrends({ data }: PopulationTrendsProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-surface-obsidian border border-border-glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-cyan" />
          <h3 className="text-sm font-semibold text-white">Population Trends</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold text-white/50 bg-white/5 border border-white/10 px-2 py-1 rounded">
          Illustrative Trend View (Demo)
        </span>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="rgba(255,255,255,0.2)" 
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.2)" 
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => val.toLocaleString()}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px' }}
              labelStyle={{ color: '#aaa', fontSize: '12px', marginBottom: '4px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Line 
              type="monotone" 
              name="Total Admissions"
              dataKey="admissions" 
              stroke="#00d4ff" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#00d4ff', strokeWidth: 0 }} 
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              name="Readmissions"
              dataKey="readmissions" 
              stroke="#ff4d4f" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#ff4d4f', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

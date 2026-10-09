'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ComposedChart } from 'recharts';
import { ShieldAlert, Users } from 'lucide-react';

interface RiskChartsProps {
  distribution: {
    Low: number;
    Medium: number;
    High: number;
    Critical: number;
  };
  pyramid: { age: string; Male: number; Female: number }[];
}

export function RiskCharts({ distribution, pyramid }: RiskChartsProps) {
  const distData = [
    { name: 'Critical', value: distribution.Critical, color: '#ff4d4f' },
    { name: 'High', value: distribution.High, color: '#faad14' },
    { name: 'Medium', value: distribution.Medium, color: '#13c2c2' },
    { name: 'Low', value: distribution.Low, color: '#52c41a' },
  ];

  const totalRiskEncounters = distribution.Critical + distribution.High;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Risk Summary & Distribution */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="bg-surface-obsidian border border-border-glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold text-white">High Risk Summary</h3>
          </div>
          <p className="text-xs text-white/50 mb-4">
            Encounters classified as High or Critical by the displayed utilization heuristic.
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-white">{totalRiskEncounters.toLocaleString()}</span>
            <span className="text-sm text-white/40 mb-1">encounters</span>
          </div>
        </div>

        <div className="bg-surface-obsidian border border-border-glass rounded-xl p-4 flex-1 min-h-[250px]">
          <h3 className="text-sm font-semibold text-white mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {distData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Population Pyramid */}
      <div className="lg:col-span-2 bg-surface-obsidian border border-border-glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-cyan" />
            <h3 className="text-sm font-semibold text-white">Population Pyramid</h3>
          </div>
          <span className="text-xs text-white/40">
            Demographic Distribution (Male vs Female)
          </span>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart layout="vertical" data={pyramid} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                tickFormatter={(value) => Math.abs(value).toLocaleString()} 
                stroke="rgba(255,255,255,0.2)" 
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
              />
              <YAxis 
                dataKey="age" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                width={70}
              />
              <Tooltip 
                formatter={(value, name) => [Math.abs(Number(value ?? 0)).toLocaleString(), String(name)]}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Female" stackId="a" fill="#d8b4e2" barSize={20} radius={[4, 0, 0, 4]} />
              <Bar dataKey="Male" stackId="a" fill="#82ca9d" barSize={20} radius={[0, 4, 4, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

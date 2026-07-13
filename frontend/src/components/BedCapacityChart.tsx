"use client";

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const data = [
  { name: 'ICU', capacity: 82, optimal: 75 },
  { name: 'ER', capacity: 95, optimal: 80 },
  { name: 'Surgery', capacity: 60, optimal: 85 },
  { name: 'Pediatrics', capacity: 45, optimal: 70 },
  { name: 'Oncology', capacity: 78, optimal: 80 },
];

export default function BedCapacityChart() {
  return (
    <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-2xl p-6 h-full shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Bed Utilization per Dept</h3>
        <p className="text-sm text-slate-400">% capacity vs optimal targets</p>
      </div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: '#1e293b', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              itemStyle={{ color: '#2dd4bf' }}
            />
            <Bar dataKey="capacity" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.capacity > entry.optimal ? '#ef4444' : '#0d9488'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

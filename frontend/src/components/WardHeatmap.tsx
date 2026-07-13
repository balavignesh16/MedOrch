"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'ICU', capacity: 95, fill: '#ef4444' }, // Red (Critical)
  { name: 'ER', capacity: 82, fill: '#f59e0b' },   // Orange (Warning)
  { name: 'Surgery', capacity: 65, fill: '#14b8a6' }, // Teal (Normal)
  { name: 'Oncology', capacity: 45, fill: '#14b8a6' },
  { name: 'Pediatrics', capacity: 70, fill: '#f59e0b' },
  { name: 'Cardiology', capacity: 88, fill: '#ef4444' },
];

export default function WardHeatmap() {
  return (
    <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6 shadow-lg h-full flex flex-col">
      <h3 className="text-slate-400 font-medium mb-1">Hospital Ward Capacity Heatmap</h3>
      <p className="text-xs text-slate-500 mb-6">Real-time occupancy percentage by department</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={80} />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
              itemStyle={{ color: '#14b8a6' }}
              formatter={(value) => [`${value}% Occupied`, 'Capacity']}
            />
            <Bar dataKey="capacity" radius={[0, 4, 4, 0]} barSize={24}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

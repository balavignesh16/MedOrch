"use client";

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis
} from 'recharts';

const data = [
  { risk: 10, cost: 5000, cohort: 40 },
  { risk: 15, cost: 12000, cohort: 80 },
  { risk: 35, cost: 45000, cohort: 120 },
  { risk: 55, cost: 85000, cohort: 60 },
  { risk: 20, cost: 25000, cohort: 200 },
  { risk: 85, cost: 140000, cohort: 30 },
];

export default function CostScatterPlot() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full shadow-sm flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Readmission Risk vs Cost Impact</h3>
        <p className="text-sm text-slate-500">Predicted financial exposure</p>
      </div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" dataKey="risk" name="Risk %" unit="%" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis type="number" dataKey="cost" name="Cost" unit="$" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <ZAxis type="number" dataKey="cohort" range={[50, 400]} name="Patient Cohort" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Scatter name="Predictions" data={data} fill="#0ea5e9" opacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

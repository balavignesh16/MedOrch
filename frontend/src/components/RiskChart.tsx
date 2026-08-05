import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Day 1', capacity: 65 },
  { name: 'Day 5', capacity: 68 },
  { name: 'Day 10', capacity: 72 },
  { name: 'Day 15', capacity: 70 },
  { name: 'Day 20', capacity: 75 },
  { name: 'Day 25', capacity: 80 },
  { name: 'Day 30', capacity: 82 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-md">
        <p className="text-slate-500 font-medium text-sm">{label}</p>
        <p className="text-brand-teal font-bold">{`Capacity: ${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

const RiskChart = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-lg font-bold mb-4 text-slate-900">ICU Utilization Trend (30 Days)</h3>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCapacity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="capacity" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorCapacity)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RiskChart;

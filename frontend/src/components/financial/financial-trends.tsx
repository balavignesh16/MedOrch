'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Info } from 'lucide-react';

interface FinancialTrendsProps {
  data: {
    period: string;
    avgCost: number;
    totalCost: number;
    medCost: number;
    readmissionCost: number;
  }[];
}

export function FinancialTrends({ data }: FinancialTrendsProps) {
  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-obsidian border border-border-glass rounded-lg p-3 shadow-xl min-w-[200px]">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between gap-4 text-sm mb-1">
              <span className="text-white/70">{entry.name}</span>
              <span className="font-bold" style={{ color: entry.color }}>
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Estimated Cost Trends</h2>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-cyan/10 border border-brand-cyan/20 rounded-md">
          <Info className="h-4 w-4 text-brand-cyan" />
          <span className="text-xs text-brand-cyan font-medium">
            Illustrative Trend View (Demo)
          </span>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorReadm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis 
              dataKey="period" 
              stroke="rgba(255,255,255,0.5)" 
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="left"
              stroke="rgba(255,255,255,0.5)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val/1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="totalCost" 
              name="Total Cost" 
              stroke="#00e5ff" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorTotal)" 
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="readmissionCost" 
              name="Readmission Penalty"
              stroke="#ff4d4f" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorReadm)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

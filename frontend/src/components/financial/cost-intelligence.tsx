'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Info } from 'lucide-react';
import type { fetchCostIntelligence } from '@/lib/financialLogic';

interface CostIntelligenceProps {
  data: Awaited<ReturnType<typeof fetchCostIntelligence>>;
  onFilterChange: (key: string, value: string) => void;
}

const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

interface CostTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string; value?: number | string }>;
  label?: React.ReactNode;
}

function CostTooltip({ active, payload, label }: CostTooltipProps) {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-obsidian border border-border-glass rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between gap-4 text-sm">
              <span className="text-white/70">{entry.name}</span>
              <span className="text-brand-cyan font-bold">
                {entry.name?.includes('Cost') ? formatCurrency(Number(entry.value ?? 0)) : Number(entry.value ?? 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
}

export function CostIntelligence({ data, onFilterChange }: CostIntelligenceProps) {

  return (
    <div className="space-y-6 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-lg font-bold text-white">Cost Intelligence</h2>
        <div className="flex items-center gap-2 px-2 py-1 bg-brand-cyan/10 border border-brand-cyan/20 rounded-md">
          <Info className="h-3 w-3 text-brand-cyan" />
          <span className="text-[10px] text-brand-cyan font-medium uppercase">
            Estimated Cost Model (Analytical)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagnosis Cost */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Top Diagnosis by Estimated Cost</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDiagnosis} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis type="number" tickFormatter={(val) => `$${val/1000}k`} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="category" width={90} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
                <Tooltip content={<CostTooltip />} />
                <Bar dataKey="total_cost" name="Total Est. Cost" radius={[0, 4, 4, 0]} onClick={(data) => onFilterChange('diag_1', String(data.payload?.category ?? ''))} className="cursor-pointer">
                  {data.byDiagnosis.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#00e5ff" className="hover:opacity-80" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Age Cost */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Estimated Cost by Age Cohort</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byAge} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="category" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(val) => `$${val/1000}k`} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
                <Tooltip content={<CostTooltip />} />
                <Bar dataKey="avg_cost" name="Avg Est. Cost" radius={[4, 4, 0, 0]} onClick={(data) => onFilterChange('age', String(data.payload?.category ?? ''))} className="cursor-pointer">
                  {data.byAge.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#b14bf4" className="hover:opacity-80" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Risk Cost */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Estimated Cost by Risk Level</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byRisk} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="category" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(val) => `$${val/1000}k`} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
                <Tooltip content={<CostTooltip />} />
                <Bar dataKey="total_cost" name="Total Est. Cost" radius={[4, 4, 0, 0]} onClick={(data) => onFilterChange('riskLevel', String(data.payload?.category ?? ''))} className="cursor-pointer">
                  {data.byRisk.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.category === 'Critical' ? '#ff4d4f' : entry.category === 'High' ? '#faad14' : entry.category === 'Medium' ? '#13c2c2' : '#52c41a'} className="hover:opacity-80" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gender Cost */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Estimated Cost by Gender</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byGender} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis type="number" tickFormatter={(val) => `$${val/1000}k`} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="category" width={60} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
                <Tooltip content={<CostTooltip />} />
                <Bar dataKey="avg_cost" name="Avg Est. Cost" radius={[0, 4, 4, 0]} onClick={(data) => onFilterChange('gender', String(data.payload?.category ?? ''))} className="cursor-pointer">
                  {data.byGender.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#1e88e5" className="hover:opacity-80" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>
    </div>
  );
}

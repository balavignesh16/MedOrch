'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CostBreakdownProps {
  overview: {
    readmissionCost: number;
    medicationCost: number;
    laboratoryCost: number;
    procedureCost: number;
    emergencyCost: number;
    totalCost: number;
  };
}

export function CostBreakdown({ overview }: CostBreakdownProps) {
  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // Calculate base encounter cost (remainder)
  const accountedCost = 
    overview.readmissionCost + 
    overview.medicationCost + 
    overview.laboratoryCost + 
    overview.procedureCost + 
    overview.emergencyCost;
    
  const baseCost = Math.max(0, overview.totalCost - accountedCost);

  const data = [
    { name: 'Base Encounter & LOS', value: baseCost, color: '#00e5ff' },
    { name: 'Clinical Procedures', value: overview.procedureCost, color: '#b14bf4' },
    { name: 'Medications', value: overview.medicationCost, color: '#13c2c2' },
    { name: 'Laboratories', value: overview.laboratoryCost, color: '#1e88e5' },
    { name: 'Emergency Care', value: overview.emergencyCost, color: '#faad14' },
    { name: 'Readmission Penalty', value: overview.readmissionCost, color: '#ff4d4f' },
  ].filter(d => d.value > 0);

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-lg font-bold text-white mb-6">Estimated Cost Composition</h2>
      
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => (
                <span className="text-white/70 ml-1">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

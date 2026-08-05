"use client";

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useRouter, useSearchParams } from 'next/navigation';

interface TrendChartProps {
  data: { age_group: string; patient_count: number }[];
}

export function TrendChart({ data }: TrendChartProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentAgeFilter = searchParams.get('age');

  const handleBarClick = (entry: any) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentAgeFilter === entry.age_group) {
      params.delete('age');
    } else {
      params.set('age', entry.age_group);
    }
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  if (!data || data.length === 0) {
    return (
      <Card widgetSize="xl" className="h-96 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <span className="text-white/20">?</span>
        </div>
        <h3 className="text-lg font-medium text-white/80">No Chart Data Available</h3>
        <p className="text-sm text-white/40 mt-2 max-w-[400px] w-full">
          The selected timeframe returned zero records for demographic trends.
        </p>
      </Card>
    );
  }

  return (
    <Card widgetSize="xl" className="h-96 flex flex-col lg:col-span-8">
      <CardHeader>
        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Admissions by Age Group
        </h3>
      </CardHeader>
      <CardContent className="flex-1 h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="age_group" 
              stroke="rgba(255,255,255,0.4)" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.4)" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ 
                backgroundColor: 'rgba(10, 10, 10, 0.9)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
              itemStyle={{ color: '#14b8a6' }}
            />
            <Bar 
              dataKey="patient_count" 
              name="Admissions" 
              radius={[4, 4, 0, 0]}
              onClick={handleBarClick}
              className="cursor-pointer"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={currentAgeFilter && currentAgeFilter !== entry.age_group ? "#14b8a633" : "#14b8a6"} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

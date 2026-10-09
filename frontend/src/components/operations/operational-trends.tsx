import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendData {
  period: string;
  encounters: number;
  los: number;
  erVisits: number;
}

interface OperationalTrendsProps {
  trends: TrendData[];
}

export function OperationalTrends({ trends }: OperationalTrendsProps) {
  if (!trends || trends.length === 0) return null;

  return (
    <Card className="bg-surface-black/40 border-white/5 h-full">
      <CardHeader className="border-b border-white/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-cyan" />
            Operational Distribution by Admission Type
          </CardTitle>
          <span className="text-[10px] text-white/40 uppercase bg-white/5 px-2 py-1 rounded">
            Non-temporal source distribution
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorER" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="period" 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.3)" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f1115', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="encounters" 
                name="Encounters"
                stroke="#14b8a6" 
                fillOpacity={1} 
                fill="url(#colorThroughput)" 
              />
              <Area 
                type="monotone" 
                dataKey="erVisits" 
                name="ER Visits"
                stroke="#f97316" 
                fillOpacity={1} 
                fill="url(#colorER)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

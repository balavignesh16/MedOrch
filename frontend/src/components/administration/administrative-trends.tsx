import React from 'react';
import type { fetchAdministrativeTrends } from '@/lib/administrationLogic';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface AdministrativeTrendsProps {
  trends: Awaited<ReturnType<typeof fetchAdministrativeTrends>>;
}

export const AdministrativeTrends: React.FC<AdministrativeTrendsProps> = ({ trends }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="text-base font-semibold text-white flex items-center">
          <TrendingUp className="text-brand-cyan w-5 h-5 mr-2" />
          Administrative Trends
        </h3>
        <div className="text-[10px] text-brand-gray px-3 py-1 bg-slate-900/50 rounded-full border border-white/5 hidden sm:block">
          Administrative Analytics Model (Analytical)
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.4)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => val.split('-').slice(1).join('/')}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.4)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="performance" name="Dept Performance" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: '#22d3ee', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="staffing" name="Staffing Effic." stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="capacity" name="Capacity Util." stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="compliance" name="Compliance" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

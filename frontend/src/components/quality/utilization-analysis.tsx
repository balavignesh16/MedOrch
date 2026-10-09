import React from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Users, AlertCircle } from 'lucide-react';

interface UtilizationProps {
  data: {
    totals: { er: number; inpatient: number; outpatient: number };
    visitFrequency: { total_visits: number; count: number }[];
  };
  totalEncounters: number;
}

export function UtilizationAnalysis({ data, totalEncounters }: UtilizationProps) {
  const maxCount = Math.max(...data.visitFrequency.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-white/50 text-xs uppercase tracking-wider block mb-1">Total ER Visits</span>
            <span className="text-2xl font-bold text-danger">{data.totals.er.toLocaleString()}</span>
          </div>
          <div className="h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center">
            <Activity className="h-6 w-6 text-danger" />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-white/50 text-xs uppercase tracking-wider block mb-1">Total Inpatient Visits</span>
            <span className="text-2xl font-bold text-brand-cyan">{data.totals.inpatient.toLocaleString()}</span>
          </div>
          <div className="h-12 w-12 rounded-full bg-brand-cyan/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-brand-cyan" />
          </div>
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-white/50 text-xs uppercase tracking-wider block mb-1">Total Outpatient Visits</span>
            <span className="text-2xl font-bold text-success">{data.totals.outpatient.toLocaleString()}</span>
          </div>
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
            <Activity className="h-6 w-6 text-success" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-brand-orange" />
          Visit Frequency Distribution (High Utilizers)
        </h3>
        
        <div className="space-y-3">
          {data.visitFrequency.map((row, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm text-white/80 w-32">
                {row.total_visits} {row.total_visits === 1 ? 'Visit' : 'Visits'}
              </span>
              <div className="flex-1 mx-4">
                <div className="w-full bg-surface-black h-4 rounded-sm overflow-hidden border border-white/5">
                  <div 
                    className={`h-full ${row.total_visits >= 5 ? 'bg-danger/80' : row.total_visits >= 3 ? 'bg-brand-orange/80' : 'bg-brand-cyan/80'}`}
                    style={{ width: `${(row.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-white text-right w-24">
                {row.count.toLocaleString()} encounters
                <span className="text-[10px] text-white/40 block">
                  {((row.count / totalEncounters) * 100).toFixed(1)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BriefcaseMedical } from 'lucide-react';

interface ResourceItem {
  name: string;
  utilization: number;
  capacity: number;
  contribution: number;
  trend: string;
  benchmark: number;
  variance: string;
}

interface OperationalResourcesProps {
  resources: ResourceItem[];
}

export function OperationalResources({ resources }: OperationalResourcesProps) {
  if (!resources || resources.length === 0) return null;

  return (
    <Card className="bg-surface-black/40 border-white/5 h-full">
      <CardHeader className="border-b border-white/5">
        <CardTitle className="text-lg flex items-center gap-2">
          <BriefcaseMedical className="h-5 w-5 text-brand-teal" />
              Synthetic Resource Utilization Scenario
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-white/50 uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 font-medium">Resource</th>
                <th className="px-6 py-3 font-medium">Utilization</th>
                <th className="px-6 py-3 font-medium">Capacity</th>
                <th className="px-6 py-3 font-medium">Contribution</th>
                <th className="px-6 py-3 font-medium">Trend</th>
                <th className="px-6 py-3 font-medium">Benchmark</th>
                <th className="px-6 py-3 font-medium text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {resources.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-12 ${item.utilization > 90 ? 'text-danger' : item.utilization > 80 ? 'text-warning' : 'text-success'}`}>
                        {item.utilization.toFixed(1)}%
                      </span>
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.utilization > 90 ? 'bg-danger' : item.utilization > 80 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${item.utilization}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/70">{item.capacity}%</td>
                  <td className="px-6 py-4 text-brand-cyan">{item.contribution.toFixed(1)}%</td>
                  <td className={`px-6 py-4 ${item.trend.startsWith('+') ? 'text-warning' : 'text-success'}`}>
                    {item.trend}
                  </td>
                  <td className="px-6 py-4 text-white/50">{item.benchmark}%</td>
                  <td className={`px-6 py-4 text-right font-medium ${item.variance.startsWith('+') ? 'text-danger' : 'text-success'}`}>
                    {item.variance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

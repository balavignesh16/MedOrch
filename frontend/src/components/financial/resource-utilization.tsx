'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Pill, Stethoscope, AlertTriangle, Building, Bed } from 'lucide-react';

interface ResourceUtilizationProps {
  data: {
    medications: number;
    laboratories: number;
    procedures: number;
    emergency: number;
    inpatient: number;
    outpatient: number;
  };
  totalCost: number;
}

export function ResourceUtilization({ data, totalCost }: ResourceUtilizationProps) {
  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // Calculate estimated costs based on config multipliers
  const costs = {
    medications: data.medications * 3,
    laboratories: data.laboratories * 5,
    procedures: data.procedures * 20,
    emergency: data.emergency * 30,
    inpatient: data.inpatient * 40,
    outpatient: data.outpatient * 5
  };

  const resources = [
    { name: 'Medications', count: data.medications, cost: costs.medications, icon: <Pill className="h-5 w-5 text-brand-teal" /> },
    { name: 'Lab Procedures', count: data.laboratories, cost: costs.laboratories, icon: <Activity className="h-5 w-5 text-brand-purple" /> },
    { name: 'Clinical Procedures', count: data.procedures, cost: costs.procedures, icon: <Stethoscope className="h-5 w-5 text-brand-cyan" /> },
    { name: 'Emergency Visits', count: data.emergency, cost: costs.emergency, icon: <AlertTriangle className="h-5 w-5 text-danger" /> },
    { name: 'Inpatient Visits', count: data.inpatient, cost: costs.inpatient, icon: <Bed className="h-5 w-5 text-warning" /> },
    { name: 'Outpatient Visits', count: data.outpatient, cost: costs.outpatient, icon: <Building className="h-5 w-5 text-success" /> },
  ].sort((a, b) => b.cost - a.cost);

  return (
    <Card className="p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Resource Utilization Breakdown</h2>
        <div className="text-sm text-white/50">
          Estimated financial contribution of clinical resources
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((res, i) => (
          <div key={i} className="bg-surface-black/30 border border-white/5 rounded-lg p-4 hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {res.icon}
                <h3 className="text-sm font-semibold text-white/90">{res.name}</h3>
              </div>
              <div className="text-xs font-bold px-2 py-1 bg-white/5 rounded">
                {((res.cost / (totalCost || 1)) * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="flex justify-between items-end mt-4">
              <div>
                <div className="text-xs text-white/50 mb-1">Utilization Volume</div>
                <div className="text-lg font-bold text-white">
                  {res.count.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/50 mb-1">Est. Cost Impact</div>
                <div className="text-lg font-bold text-brand-cyan">
                  {formatCurrency(res.cost)}
                </div>
              </div>
            </div>

            {/* Mini progress bar for visual weight */}
            <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
              <div 
                className="h-full bg-brand-cyan"
                style={{ width: `${Math.min(100, (res.cost / (totalCost || 1)) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

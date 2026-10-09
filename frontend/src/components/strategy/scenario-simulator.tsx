'use client';

import React, { useState } from 'react';
import { Calculator, ArrowRight } from 'lucide-react';

export function ScenarioSimulator() {
  const [readmission, setReadmission] = useState(15.2);
  const [los, setLos] = useState(4.2);
  const [staffing, setStaffing] = useState(88);

  // Deterministic projection logic
  const baselineCost = 2840;
  const projectedCost = Math.round(baselineCost - ((15.2 - readmission) * 50) - ((4.2 - los) * 120));
  
  const baselineCapacity = 85;
  const projectedCapacity = Math.round(baselineCapacity + ((4.2 - los) * 4) + ((staffing - 88) * 0.2));

  return (
    <div className="bg-surface-glass border border-border-glass rounded-2xl p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-white flex items-center">
          <Calculator className="w-5 h-5 mr-2 text-brand-teal" />
          Scenario Simulator
        </h3>
        <span className="text-[10px] uppercase tracking-wider font-bold text-brand-teal bg-brand-teal/10 px-2 py-1 rounded-full">
          Analytical Scenario — Not Forecasted Actuals
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h4 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">Adjust Parameters</h4>
          
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-white/90">Readmission Rate (%)</label>
              <span className="text-sm font-mono text-brand-cyan">{readmission}%</span>
            </div>
            <input 
              type="range" min="10" max="20" step="0.1" 
              value={readmission} 
              onChange={(e) => setReadmission(parseFloat(e.target.value))} 
              className="w-full accent-brand-teal"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-white/90">Avg Length of Stay (Days)</label>
              <span className="text-sm font-mono text-brand-cyan">{los}</span>
            </div>
            <input 
              type="range" min="3.0" max="6.0" step="0.1" 
              value={los} 
              onChange={(e) => setLos(parseFloat(e.target.value))} 
              className="w-full accent-brand-teal"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-white/90">Staffing Efficiency (%)</label>
              <span className="text-sm font-mono text-brand-cyan">{staffing}%</span>
            </div>
            <input 
              type="range" min="75" max="100" step="1" 
              value={staffing} 
              onChange={(e) => setStaffing(parseInt(e.target.value))} 
              className="w-full accent-brand-teal"
            />
          </div>
        </div>

        <div className="space-y-6 bg-slate-900/50 p-6 rounded-xl border border-white/5">
          <h4 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">Projected Impact</h4>
          
          <div className="flex items-center justify-between p-4 bg-surface-black border border-white/10 rounded-lg">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Cost per Encounter</p>
              <div className="flex items-center gap-3">
                <span className="text-lg text-white font-mono">${baselineCost}</span>
                <ArrowRight className="w-4 h-4 text-white/30" />
                <span className={`text-xl font-bold font-mono ${projectedCost < baselineCost ? 'text-success' : 'text-danger'}`}>
                  ${projectedCost}
                </span>
              </div>
            </div>
            <div className="text-right">
               <span className={`text-sm font-bold ${projectedCost < baselineCost ? 'text-success' : 'text-danger'}`}>
                 {projectedCost < baselineCost ? '-' : '+'}${Math.abs(baselineCost - projectedCost)}
               </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-surface-black border border-white/10 rounded-lg">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Capacity Utilization</p>
              <div className="flex items-center gap-3">
                <span className="text-lg text-white font-mono">{baselineCapacity}%</span>
                <ArrowRight className="w-4 h-4 text-white/30" />
                <span className={`text-xl font-bold font-mono ${projectedCapacity > baselineCapacity ? 'text-success' : 'text-danger'}`}>
                  {projectedCapacity}%
                </span>
              </div>
            </div>
            <div className="text-right">
               <span className={`text-sm font-bold ${projectedCapacity > baselineCapacity ? 'text-success' : 'text-danger'}`}>
                 {projectedCapacity > baselineCapacity ? '+' : ''}{projectedCapacity - baselineCapacity}%
               </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

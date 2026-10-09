import React from 'react';
import { Card } from '@/components/ui/card';
import { Info, Database, Clock, Calculator } from 'lucide-react';
import { FINANCIAL_COST_MULTIPLIERS as COST, FINANCIAL_MODEL_METADATA as MODEL } from '@/lib/analytics/config';

export function FinancialModelTransparency() {
  const weights = [
    { label: 'Base Encounter Index', value: String(COST.BASE_ENCOUNTER) },
    { label: 'Length of Stay Weight', value: `${COST.LOS_PER_DAY} / day` },
    { label: 'Medication Weight', value: `${COST.MEDICATION} / unit` },
    { label: 'Laboratory Weight', value: `${COST.LAB_PROCEDURE} / test` },
    { label: 'Procedure Weight', value: `${COST.CLINICAL_PROCEDURE} / proc` },
    { label: 'Emergency Weight', value: `${COST.EMERGENCY_VISIT} / visit` },
    { label: 'Inpatient Weight', value: `${COST.INPATIENT_VISIT} / visit` },
    { label: 'Outpatient Weight', value: `${COST.OUTPATIENT_VISIT} / visit` },
    { label: 'Readmission Weight', value: `${COST.READMISSION_PENALTY} / proxy event` },
  ];

  return (
    <Card className="p-4 mb-6 bg-surface-black/40 border-brand-cyan/20">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-brand-cyan/10 rounded-xl">
          <Calculator className="h-6 w-6 text-brand-cyan" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white">Estimated Relative Cost Model</h3>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider font-semibold">
              <span className="flex items-center gap-1 text-white/50">
                <Database className="h-3 w-3" /> Clinical Utilization
              </span>
              <span className="flex items-center gap-1 text-brand-cyan">
                <Info className="h-3 w-3" /> {MODEL.VERSION}
              </span>
              <span className="flex items-center gap-1 text-white/50">
                <Clock className="h-3 w-3" /> Bundled data
              </span>
            </div>
          </div>
          <p className="text-xs text-white/60 mb-4">
            Financial analytics in this dashboard are derived from clinical utilization volumes and algorithmic weighting. 
            They represent an <strong className="text-white">Estimated Relative Cost Model</strong> in {MODEL.UNIT} and are <strong>NOT</strong> actual hospital billing amounts.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {weights.map((w, i) => (
              <div key={i} className="bg-surface-obsidian border border-white/5 p-2 rounded-lg flex flex-col justify-between">
                <span className="text-[10px] text-white/50 mb-1">{w.label}</span>
                <span className="text-sm font-bold text-brand-cyan">{w.value}</span>
              </div>
            ))}
            <div className="bg-brand-cyan/10 border border-brand-cyan/30 p-2 rounded-lg flex flex-col justify-between">
              <span className="text-[10px] text-brand-cyan mb-1">Estimated Cost Multiplier</span>
              <span className="text-sm font-bold text-white">x 1.0</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

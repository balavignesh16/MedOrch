import React from 'react';
import { Activity, Pill, Beaker, Clock, AlertCircle } from 'lucide-react';

interface PatientTimelineProps {
  encounters: any[];
}

export function PatientTimeline({ encounters }: PatientTimelineProps) {
  return (
    <div className="bg-surface-obsidian border border-border-glass rounded-xl p-6">
      <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Longitudinal Clinical Timeline</h3>
      
      <div className="relative border-l border-white/10 ml-4 space-y-8 pb-4">
        {encounters.map((encounter, idx) => (
          <div key={encounter.encounter_id} className="relative pl-8">
            <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-surface-obsidian ${
              encounter.risk_level === 'High' ? 'bg-brand-orange' : 'bg-brand-cyan'
            }`} />
            
            <div className="bg-surface-black border border-white/5 rounded-xl p-5 hover:bg-white/[0.02] transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-white font-bold text-lg">
                    Encounter <span className="text-white/50 font-mono">#{encounter.encounter_id}</span>
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    encounter.readmitted === '<30' ? 'bg-danger/10 text-danger border border-danger/20' :
                    encounter.readmitted === '>30' ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' :
                    'bg-success/10 text-success border border-success/20'
                  }`}>
                    {encounter.readmitted === 'NO' ? 'NO READMISSION' : `READMITTED ${encounter.readmitted}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg text-sm text-white/80 font-medium">
                  <Clock className="h-4 w-4 text-brand-cyan" />
                  {encounter.time_in_hospital} Days LOS
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Diagnoses */}
                <div>
                  <h5 className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Diagnoses (ICD-9)</h5>
                  <div className="flex flex-wrap gap-2">
                    {encounter.diag_1 && (
                      <span className="px-2 py-1 bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan rounded-md text-xs font-mono font-medium">
                        1: {encounter.diag_1}
                      </span>
                    )}
                    {encounter.diag_2 && (
                      <span className="px-2 py-1 bg-white/5 border border-white/10 text-white/70 rounded-md text-xs font-mono font-medium">
                        2: {encounter.diag_2}
                      </span>
                    )}
                    {encounter.diag_3 && (
                      <span className="px-2 py-1 bg-white/5 border border-white/10 text-white/70 rounded-md text-xs font-mono font-medium">
                        3: {encounter.diag_3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Clinical Volume */}
                <div>
                  <h5 className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Clinical Volume</h5>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <Pill className="h-4 w-4 text-white/40" />
                      {encounter.num_medications} Meds
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <Beaker className="h-4 w-4 text-white/40" />
                      {encounter.num_lab_procedures} Labs
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <Activity className="h-4 w-4 text-white/40" />
                      {encounter.num_procedures} Procedures
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

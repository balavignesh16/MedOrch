import React from 'react';
import { User, Activity, AlertCircle, Clock, Pill, ActivitySquare, HeartPulse } from 'lucide-react';

interface PatientProfileProps {
  profile: {
    patient_nbr: string;
    age: string;
    gender: string;
    race: string;
    totalEncounters: number;
    avgLos: string;
    totalMeds: number;
    totalProcedures: number;
    totalEmergency: number;
    totalInpatient: number;
    riskLevel: string;
  };
}

export function PatientProfile({ profile }: PatientProfileProps) {
  return (
    <div className="bg-surface-obsidian border border-border-glass rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-border-glass bg-surface-black/30">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center">
            <User className="h-6 w-6 text-brand-cyan" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Patient Record
            </h2>
            <div className="text-sm text-white/50 font-mono">
              ID: {profile.patient_nbr}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1">
        {/* Demographics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-black border border-white/5 rounded-lg p-3">
            <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Age Group</span>
            <span className="text-sm font-semibold text-white">{profile.age}</span>
          </div>
          <div className="bg-surface-black border border-white/5 rounded-lg p-3">
            <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Gender</span>
            <span className="text-sm font-semibold text-white">{profile.gender}</span>
          </div>
          <div className="col-span-2 bg-surface-black border border-white/5 rounded-lg p-3">
            <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Race / Ethnicity</span>
            <span className="text-sm font-semibold text-white">{profile.race || 'Unknown'}</span>
          </div>
        </div>

        {/* Risk Status */}
        <div className={`rounded-xl p-4 flex items-center gap-4 ${
          profile.riskLevel === 'Critical' ? 'bg-danger/10 border border-danger/20' :
          profile.riskLevel === 'High' ? 'bg-brand-orange/10 border border-brand-orange/20' :
          profile.riskLevel === 'Medium' ? 'bg-brand-teal/10 border border-brand-teal/20' :
          'bg-success/10 border border-success/20'
        }`}>
          <div className={`p-2 rounded-lg ${
            profile.riskLevel === 'Critical' ? 'bg-danger/20 text-danger' :
            profile.riskLevel === 'High' ? 'bg-brand-orange/20 text-brand-orange' :
            profile.riskLevel === 'Medium' ? 'bg-brand-teal/20 text-brand-teal' :
            'bg-success/20 text-success'
          }`}>
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-white/60 mb-0.5">Overall Risk Level</span>
            <span className={`text-lg font-bold ${
              profile.riskLevel === 'Critical' ? 'text-danger' :
              profile.riskLevel === 'High' ? 'text-brand-orange' :
              profile.riskLevel === 'Medium' ? 'text-brand-teal' :
              'text-success'
            }`}>
              {profile.riskLevel}
            </span>
          </div>
        </div>

        {/* Clinical KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-black border border-white/5 rounded-lg p-3 flex flex-col">
            <Activity className="h-4 w-4 text-brand-purple mb-2" />
            <span className="text-[10px] uppercase tracking-wider text-white/40">Encounters</span>
            <span className="text-lg font-bold text-white">{profile.totalEncounters}</span>
          </div>
          <div className="bg-surface-black border border-white/5 rounded-lg p-3 flex flex-col">
            <Clock className="h-4 w-4 text-brand-cyan mb-2" />
            <span className="text-[10px] uppercase tracking-wider text-white/40">Avg LOS</span>
            <span className="text-lg font-bold text-white">{profile.avgLos}d</span>
          </div>
          <div className="bg-surface-black border border-white/5 rounded-lg p-3 flex flex-col">
            <Pill className="h-4 w-4 text-brand-orange mb-2" />
            <span className="text-[10px] uppercase tracking-wider text-white/40">Total Meds</span>
            <span className="text-lg font-bold text-white">{profile.totalMeds}</span>
          </div>
          <div className="bg-surface-black border border-white/5 rounded-lg p-3 flex flex-col">
            <ActivitySquare className="h-4 w-4 text-brand-teal mb-2" />
            <span className="text-[10px] uppercase tracking-wider text-white/40">Procedures</span>
            <span className="text-lg font-bold text-white">{profile.totalProcedures}</span>
          </div>
          <div className="bg-surface-black border border-white/5 rounded-lg p-3 flex flex-col">
            <AlertCircle className="h-4 w-4 text-danger mb-2" />
            <span className="text-[10px] uppercase tracking-wider text-white/40">ER Visits</span>
            <span className="text-lg font-bold text-white">{profile.totalEmergency}</span>
          </div>
          <div className="bg-surface-black border border-white/5 rounded-lg p-3 flex flex-col">
            <HeartPulse className="h-4 w-4 text-success mb-2" />
            <span className="text-[10px] uppercase tracking-wider text-white/40">Inpatient</span>
            <span className="text-lg font-bold text-white">{profile.totalInpatient}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

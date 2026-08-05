'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, X, Filter, Save, RotateCcw } from 'lucide-react';

interface CohortExplorerProps {
  totalPatients: number;
  absoluteTotal: number;
}

export function CohortExplorer({ totalPatients, absoluteTotal }: CohortExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [gender, setGender] = useState(searchParams.get('gender') || '');
  const [age, setAge] = useState(searchParams.get('age') || '');
  const [race, setRace] = useState(searchParams.get('race') || '');

  useEffect(() => {
    setGender(searchParams.get('gender') || '');
    setAge(searchParams.get('age') || '');
    setRace(searchParams.get('race') || '');
  }, [searchParams]);

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (gender) params.set('gender', gender);
    else params.delete('gender');
    
    if (age) params.set('age', age);
    else params.delete('age');
    
    if (race) params.set('race', race);
    else params.delete('race');

    router.push(`/population?${params.toString()}`);
  };

  const handleClear = () => {
    setGender('');
    setAge('');
    setRace('');
    router.push('/population');
  };

  const percentage = absoluteTotal > 0 ? ((totalPatients / absoluteTotal) * 100).toFixed(2) : '0.00';

  return (
    <div className="bg-surface-obsidian border border-border-glass rounded-xl p-4 mb-6" role="region" aria-label="Cohort Explorer">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-brand-cyan" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-white">Cohort Explorer</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 bg-surface-black border border-white/5 px-3 py-1.5 rounded-full" aria-label={`${totalPatients} matching patients out of ${absoluteTotal} total population. ${percentage}%`}>
            <Users className="h-3.5 w-3.5 text-brand-cyan" aria-hidden="true" />
            <span className="text-xs font-medium text-white/90">
              {totalPatients.toLocaleString()} / {absoluteTotal.toLocaleString()} patients
            </span>
            <span className="text-xs font-bold text-brand-cyan/80 px-1.5 py-0.5 bg-brand-cyan/10 rounded ml-1">
              {percentage}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-black border border-white/5 text-white/30 text-xs font-medium cursor-not-allowed"
              aria-label="Save Cohort (Disabled)"
              title="Save Cohort functionality coming in future sprint"
            >
              <Save className="h-3.5 w-3.5" />
              Save Cohort
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/60 font-medium uppercase tracking-wider" htmlFor="filter-gender">Gender</label>
          <select 
            id="filter-gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="bg-surface-black border border-border-glass rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-colors min-w-[150px]"
            aria-label="Filter by gender"
          >
            <option className="bg-[#111] text-white" value="">All Genders</option>
            <option className="bg-[#111] text-white" value="Female">Female</option>
            <option className="bg-[#111] text-white" value="Male">Male</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/60 font-medium uppercase tracking-wider" htmlFor="filter-age">Age Group</label>
          <select 
            id="filter-age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="bg-surface-black border border-border-glass rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-colors min-w-[150px]"
            aria-label="Filter by age group"
          >
            <option className="bg-[#111] text-white" value="">All Ages</option>
            <option className="bg-[#111] text-white" value="[20-30)">20-30</option>
            <option className="bg-[#111] text-white" value="[30-40)">30-40</option>
            <option className="bg-[#111] text-white" value="[40-50)">40-50</option>
            <option className="bg-[#111] text-white" value="[50-60)">50-60</option>
            <option className="bg-[#111] text-white" value="[60-70)">60-70</option>
            <option className="bg-[#111] text-white" value="[70-80)">70-80</option>
            <option className="bg-[#111] text-white" value="[80-90)">80-90</option>
            <option className="bg-[#111] text-white" value="[90-100)">90-100</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/60 font-medium uppercase tracking-wider" htmlFor="filter-race">Race</label>
          <select 
            id="filter-race"
            value={race}
            onChange={(e) => setRace(e.target.value)}
            className="bg-surface-black border border-border-glass rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-colors min-w-[150px]"
            aria-label="Filter by race"
          >
            <option className="bg-[#111] text-white" value="">All Races</option>
            <option className="bg-[#111] text-white" value="Caucasian">Caucasian</option>
            <option className="bg-[#111] text-white" value="AfricanAmerican">African American</option>
            <option className="bg-[#111] text-white" value="Hispanic">Hispanic</option>
            <option className="bg-[#111] text-white" value="Other">Other</option>
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button 
            onClick={handleClear}
            className="px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all focus:outline-none focus:ring-1 focus:ring-white/30"
            aria-label="Reset Filters"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button 
            onClick={handleApply}
            className="px-4 py-2 bg-brand-cyan text-surface-obsidian rounded-lg text-sm font-bold hover:bg-brand-cyan/90 transition-all shadow-[0_0_15px_rgba(45,212,191,0.2)] hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] focus:outline-none focus:ring-2 focus:ring-brand-cyan/50"
            aria-label="Apply Filters"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

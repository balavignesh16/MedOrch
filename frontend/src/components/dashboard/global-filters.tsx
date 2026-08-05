"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter } from 'lucide-react';

const FILTER_OPTIONS = {
  gender: ['Male', 'Female'],
  age: ['[0-10)', '[10-20)', '[20-30)', '[30-40)', '[40-50)', '[50-60)', '[60-70)', '[70-80)', '[80-90)', '[90-100)'],
  race: ['Caucasian', 'AfricanAmerican', 'Asian', 'Hispanic', 'Other'],
  readmitted: ['NO', '>30', '<30']
};

export function GlobalFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex items-center text-white/50 text-xs uppercase tracking-wider font-semibold mr-2">
        <Filter className="h-3 w-3 mr-1" /> Filters
      </div>
      
      {Object.entries(FILTER_OPTIONS).map(([key, options]) => (
        <select
          key={key}
          value={searchParams.get(key) || ''}
          onChange={(e) => handleFilterChange(key, e.target.value)}
          className="bg-surface-glass border border-white/10 rounded-md text-xs text-white/80 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal capitalize appearance-none cursor-pointer hover:bg-white/5"
        >
          <option value="">{key}</option>
          {options.map(opt => (
            <option key={opt} value={opt} className="bg-surface-obsidian text-white">{opt}</option>
          ))}
        </select>
      ))}
    </div>
  );
}

"use client";

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { X, Filter, RefreshCcw } from 'lucide-react';

export function FilterChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const activeFilters: { key: string, value: string }[] = [];
  params.forEach((value, key) => {
    activeFilters.push({ key, value });
  });

  if (activeFilters.length === 0) return null;

  const removeFilter = (key: string) => {
    params.delete(key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearAll = () => {
    router.push(pathname, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 mb-4 bg-surface-black/30 p-2 rounded-lg border border-white/5">
      <div className="flex items-center gap-1.5 px-2 text-[10px] uppercase tracking-widest font-semibold text-white/50 border-r border-white/10 mr-1">
        <Filter className="h-3 w-3" />
        <span>Active Filters</span>
        <span className="ml-1 bg-brand-cyan/20 text-brand-cyan px-1.5 py-0.5 rounded-full">{activeFilters.length}</span>
      </div>
      {activeFilters.map(({ key, value }) => (
        <div 
          key={key} 
          className="flex items-center bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-[10px] uppercase font-semibold px-2 py-1 rounded-full"
        >
          <span className="mr-1 opacity-70">{key}:</span>
          <span>{value}</span>
          <button 
            onClick={() => removeFilter(key)} 
            className="ml-1.5 hover:bg-brand-teal/20 rounded-full p-0.5 transition-colors"
            aria-label={`Remove filter ${key}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 ml-auto pr-2">
        <button 
          onClick={clearAll}
          className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white transition-colors underline underline-offset-2"
        >
          <X className="h-3 w-3" />
          Clear All
        </button>
        <button 
          onClick={clearAll}
          className="flex items-center gap-1 text-[10px] text-brand-cyan/70 hover:text-brand-cyan transition-colors ml-2"
        >
          <RefreshCcw className="h-3 w-3" />
          Reset
        </button>
      </div>
    </div>
  );
}

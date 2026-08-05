import React from 'react';
import { Users, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export function PopulationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] bg-surface-obsidian border border-border-glass rounded-xl">
      <div className="bg-white/5 p-4 rounded-full mb-4">
        <Users className="h-10 w-10 text-white/30" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">
        No Patients Found
      </h2>
      <p className="text-sm text-white/50 max-w-md mb-6">
        The current cohort filters are too restrictive and returned zero results. Please broaden your search criteria.
      </p>
      <Link 
        href="/population"
        className="flex items-center gap-2 bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/20 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
      >
        <RefreshCcw className="h-4 w-4" />
        Clear All Filters
      </Link>
    </div>
  );
}

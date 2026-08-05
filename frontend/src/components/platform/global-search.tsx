"use client";

import React, { useState, useEffect } from 'react';
import { Search, User, LayoutDashboard, Activity, FileText, Settings, Database } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface GlobalSearchProps {
  results: any[];
}

export function GlobalSearch({ results }: GlobalSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get('q') || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
      // Only push if there's an actual change to prevent infinite loops if not handled carefully
      if (searchParams?.get('q') !== query && (query !== '' || searchParams?.has('q'))) {
         router.push(`/?${params.toString()}`);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, router, searchParams]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'Patient': return <User className="w-4 h-4 text-brand-teal" />;
      case 'Dashboard': return <LayoutDashboard className="w-4 h-4 text-brand-cyan" />;
      case 'KPI': return <Activity className="w-4 h-4 text-brand-orange" />;
      case 'Insight': return <Activity className="w-4 h-4 text-danger" />;
      case 'Report': return <FileText className="w-4 h-4 text-white/70" />;
      case 'Department': return <Database className="w-4 h-4 text-brand-teal" />;
      default: return <Search className="w-4 h-4 text-white/50" />;
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input 
          type="text"
          placeholder="Search patients, dashboards, KPIs, insights..."
          className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-teal/50 transition-colors"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Suggested Results</h4>
        {results.length > 0 ? (
          results.map(result => (
            <div key={result.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
              <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
                {getIcon(result.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-sm font-medium text-white truncate">{result.title}</h5>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">{result.type}</span>
                </div>
                {result.subtitle && <p className="text-xs text-white/60 truncate mt-0.5">{result.subtitle}</p>}
                <p className="text-[10px] text-brand-teal mt-1 truncate">{result.module} &rarr; {result.url}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-white/40 italic p-3">
            No results found.
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, User, LayoutDashboard, Activity, FileText, Settings, Database, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface GlobalSearchProps {
  results: any[];
}

export function GlobalSearch({ results }: GlobalSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
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
    <div className={`bg-surface-obsidian/80 backdrop-blur-xl border transition-all duration-500 rounded-3xl p-6 shadow-2xl relative overflow-hidden ${isFocused ? 'border-brand-teal/50 shadow-[0_0_40px_rgba(45,212,191,0.15)]' : 'border-white/10'}`}>
      {/* Decorative Glow */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 bg-brand-teal/20 rounded-full blur-[80px] transition-opacity duration-500 pointer-events-none ${isFocused ? 'opacity-100' : 'opacity-0'}`}></div>
      
      <div className="relative mb-6 group">
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-brand-teal to-brand-cyan rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500 ${isFocused ? 'opacity-50' : 'opacity-20'}`}></div>
        <div className="relative bg-black/40 border border-white/10 rounded-2xl flex items-center overflow-hidden">
           <div className="pl-4 pr-3 flex items-center justify-center">
             <Search className={`w-5 h-5 transition-colors duration-300 ${isFocused ? 'text-brand-teal' : 'text-white/40'}`} />
           </div>
           <input 
             type="text"
             placeholder="Search across MedOrch Enterprise (patients, dashboards, KPIs)..."
             className="w-full bg-transparent py-4 pr-4 text-sm font-medium text-white placeholder-white/30 focus:outline-none"
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             onFocus={() => setIsFocused(true)}
             onBlur={() => setIsFocused(false)}
           />
           {query && (
             <div className="pr-4 flex items-center">
                <span className="px-2 py-1 rounded bg-white/10 text-[10px] text-white/50 font-mono">ESC</span>
             </div>
           )}
        </div>
      </div>
      
      <div className="space-y-3 relative z-10">
        <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-3 ml-2">Global Search Results</h4>
        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {results.map((result, i) => (
               <Link href={result.url} key={result.id}>
                 <div 
                   className="group flex flex-col p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all duration-300 cursor-pointer relative overflow-hidden h-full"
                 >
                   <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="flex items-start gap-3 relative z-10">
                     <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                       {getIcon(result.type)}
                     </div>
                     <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                       <div>
                         <div className="flex items-center justify-between gap-2 mb-1">
                           <h5 className="text-sm font-bold text-white/90 truncate group-hover:text-brand-teal transition-colors">{result.title}</h5>
                         </div>
                         {result.subtitle && <p className="text-xs text-white/50 truncate mb-2">{result.subtitle}</p>}
                       </div>
                       <div className="flex items-center justify-between mt-3">
                         <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/5 text-white/60 group-hover:bg-brand-teal/10 group-hover:text-brand-teal transition-colors">
                           {result.module}
                         </span>
                         <ArrowRight className="w-3 h-3 text-white/30 group-hover:text-brand-teal group-hover:translate-x-1 transition-all" />
                       </div>
                     </div>
                   </div>
                 </div>
               </Link>
             ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
            <Search className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/50 font-medium">Type anything to explore the enterprise graph.</p>
            <p className="text-xs text-white/30 mt-1">Try searching for "Cardiology", "Readmission", or "John Doe".</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Search, Activity, Pill, User, AlertCircle } from 'lucide-react';

interface CohortTableProps {
  data: {
    patients: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function CohortTable({ data }: CohortTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('searchQuery') || '');

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentSearch = searchParams.get('searchQuery') || '';
      if (search !== currentSearch) {
        updateQueryParams({ searchQuery: search, page: '1' });
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search, searchParams]);

  const updateQueryParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const handleSort = (column: string) => {
    const currentSortBy = searchParams.get('sortBy');
    const currentSortOrder = searchParams.get('sortOrder') || 'asc';
    
    if (currentSortBy === column) {
      updateQueryParams({ sortOrder: currentSortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateQueryParams({ sortBy: column, sortOrder: 'asc' });
    }
  };

  const getSortIcon = (column: string) => {
    const currentSortBy = searchParams.get('sortBy');
    const currentSortOrder = searchParams.get('sortOrder') || 'asc';
    if (currentSortBy !== column) return null;
    return <span className="ml-1 text-brand-cyan">{currentSortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="bg-surface-obsidian border border-border-glass rounded-xl overflow-hidden flex flex-col w-full shadow-lg">
      <div className="p-4 border-b border-border-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-black/30">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-brand-cyan" />
          <h3 className="text-lg font-bold text-white">Patient Cohort List</h3>
          <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-xs font-semibold">
            {data.total.toLocaleString()} Patients
          </span>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search ID or Diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-black/50 border-b border-white/5 text-xs uppercase tracking-wider text-white/50">
              <th className="p-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('patient_nbr')}>
                Patient ID {getSortIcon('patient_nbr')}
              </th>
              <th className="p-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('age')}>
                Demographics {getSortIcon('age')}
              </th>
              <th className="p-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('diag_1')}>
                Primary Diag {getSortIcon('diag_1')}
              </th>
              <th className="p-4 font-semibold text-center">Encounters</th>
              <th className="p-4 font-semibold text-center">Total Meds</th>
              <th className="p-4 font-semibold text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('readmitted')}>
                Readmission {getSortIcon('readmitted')}
              </th>
              <th className="p-4 font-semibold text-center">Risk Level</th>
              <th className="p-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.patients.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-white/40 text-sm">
                  No patients match the current filters or search query.
                </td>
              </tr>
            ) : data.patients.map((patient) => (
              <tr key={patient.patient_nbr} className="hover:bg-white/[0.02] transition-colors group">
                <td className="p-4">
                  <div className="font-mono text-sm text-white/90 font-medium">
                    {patient.patient_nbr}
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm text-white">
                    {patient.age} <span className="text-white/40">•</span> {patient.gender.charAt(0)} <span className="text-white/40">•</span> {patient.race || 'Unknown'}
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm text-white/80 font-mono">
                    {patient.diag_1}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-xs font-semibold">
                    <Activity className="h-3 w-3" />
                    {patient.num_encounters}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="inline-flex items-center gap-1 text-sm text-white/80">
                    <Pill className="h-3 w-3 text-white/40" />
                    {patient.total_medications}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    patient.last_readmission === '<30' ? 'bg-danger/10 text-danger border border-danger/20' :
                    patient.last_readmission === '>30' ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' :
                    'bg-success/10 text-success border border-success/20'
                  }`}>
                    {patient.last_readmission === 'NO' ? 'NO' : patient.last_readmission}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    patient.risk_level === 'Critical' ? 'bg-danger/20 text-danger' :
                    patient.risk_level === 'High' ? 'bg-brand-orange/20 text-brand-orange' :
                    patient.risk_level === 'Medium' ? 'bg-brand-teal/20 text-brand-teal' :
                    'bg-success/20 text-success'
                  }`}>
                    {patient.risk_level === 'Critical' && <AlertCircle className="h-3 w-3" />}
                    {patient.risk_level}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Link 
                    href={`/population/patient/${patient.patient_nbr}?${searchParams.toString()}`}
                    className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-surface-black border border-white/10 text-xs font-medium text-white/70 hover:text-white hover:bg-brand-cyan/20 hover:border-brand-cyan/30 transition-all opacity-0 group-hover:opacity-100"
                    aria-label={`View timeline for patient ${patient.patient_nbr}`}
                  >
                    View Timeline
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-border-glass flex items-center justify-between bg-surface-black/30">
        <div className="text-xs text-white/50">
          Showing {((data.page - 1) * data.pageSize) + 1} to {Math.min(data.page * data.pageSize, data.total)} of {data.total.toLocaleString()} entries
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => updateQueryParams({ page: String(Math.max(data.page - 1, 1)) })}
            disabled={data.page === 1}
            className="p-1.5 rounded-md bg-surface-black border border-white/10 text-white/70 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-white/90 font-medium px-2">
            Page {data.page} of {data.totalPages || 1}
          </span>
          <button 
            onClick={() => updateQueryParams({ page: String(Math.min(data.page + 1, data.totalPages)) })}
            disabled={data.page === data.totalPages || data.totalPages === 0}
            className="p-1.5 rounded-md bg-surface-black border border-white/10 text-white/70 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

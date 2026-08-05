import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Users, FileText } from 'lucide-react';
import { CommandPalette } from '@/components/ui/command-palette';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';
import { FilterChips } from '@/components/dashboard/filter-chips';
import { getCohortList } from '@/app/actions/populationDb';
import { CohortTable } from '@/components/population/cohort-table';

export const dynamic = 'force-dynamic';

export default async function CohortDrilldownPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const safeParams = searchParams ? Object.fromEntries(Object.entries(searchParams)) : {};
  const queryString = new URLSearchParams(safeParams as any).toString();
  const backUrl = queryString ? `/population?${queryString}` : '/population';

  const page = parseInt(safeParams.page || '1', 10);
  const pageSize = 25;
  const sortBy = safeParams.sortBy || 'patient_nbr';
  const sortOrder = safeParams.sortOrder || 'asc';
  const searchQuery = safeParams.searchQuery || '';

  const cohortData = await getCohortList(safeParams, page, pageSize, sortBy, sortOrder, searchQuery);

  return (
    <div className="min-h-screen bg-surface-black text-white selection:bg-brand-cyan/30 flex flex-col">
      <CommandPalette />
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" />
          <Link href={backUrl}>Return to Population Dashboard</Link>
        </div>

        <DashboardHeader 
          title="Patient Cohort List"
          description="Detailed view of patients matching active filters"
          showDatePicker={false}
        />
        
        <FilterChips  />

        <CohortTable data={cohortData} />
      </main>

      <DashboardFooter 
        datasetVersion="v3.0.0-POP"
        recordsLoaded={cohortData.total}
        environment="Development (Sprint 3)"
      />
    </div>
  );
}

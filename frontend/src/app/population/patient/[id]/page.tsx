import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { CommandPalette } from '@/components/ui/command-palette';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';
import { FilterChips } from '@/components/dashboard/filter-chips';
import { PatientProfile } from '@/components/population/patient-profile';
import { PatientSummary } from '@/components/population/patient-summary';
import { PatientTimeline } from '@/components/population/patient-timeline';
import { getPatientDetail } from '@/app/actions/populationDb';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PatientDetail(props: { params: Promise<{ id: string }>, searchParams: Promise<any> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const safeParams = searchParams ? Object.fromEntries(Object.entries(searchParams)) : {};
  const queryString = new URLSearchParams(safeParams as any).toString();
  const backUrl = queryString ? `/population/cohort?${queryString}` : '/population/cohort';

  const data = await getPatientDetail(params.id);
  
  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface-black text-white selection:bg-brand-cyan/30 flex flex-col">
      <CommandPalette />
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="h-4 w-4" />
          <Link href={backUrl}>Return to Patient Cohort List</Link>
        </div>

        <DashboardHeader 
          title={`Patient Detail: ${params.id}`}
          description="Longitudinal patient timeline and clinical risk profile"
          showDatePicker={false}
        />
        
        <FilterChips  />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <PatientProfile profile={data.profile} />
          </div>
          <div className="lg:col-span-8">
            <PatientSummary profile={data.profile} encounters={data.encounters} />
            <PatientTimeline encounters={data.encounters} />
          </div>
        </div>
      </main>

      <DashboardFooter 
        datasetVersion="v3.0.0-POP"
        recordsLoaded={1}
        environment="Development (Sprint 3)"
      />
    </div>
  );
}

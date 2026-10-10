import React from 'react';
import { getDb } from '@/lib/analytics/cache';
import { loadIdMappings } from '@/lib/idMappings';
import { buildOperationsFindings, getOperationsData, type OperationsData } from '@/lib/operationsData';
import { FilterChips } from '@/components/dashboard/filter-chips';
import { OperationsView } from '@/components/operations/OperationsView';

export const dynamic = 'force-dynamic';

export default async function OperationsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const raw = await props.searchParams;
  const filters = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));

  let data: OperationsData | null = null;
  try {
    data = getOperationsData(getDb(), filters, loadIdMappings());
  } catch (error) {
    console.error('Failed to compute operations data:', error);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">Operational Intelligence</h2>
        <p className="text-white/50 text-sm mt-2 max-w-3xl">
          How patients arrive, how long they stay, where they go, and how that relates to readmission — computed from the
          encounter data. The dataset has no timestamps, beds, staff or wait times, so this page shows distributions and
          proxies, not live capacity or throughput.
        </p>
      </header>
      <FilterChips />
      {data ? (
        <OperationsView data={data} findings={buildOperationsFindings(data)} />
      ) : (
        <p className="text-sm text-amber-300">Operational data is unavailable: the database could not be read.</p>
      )}
    </div>
  );
}

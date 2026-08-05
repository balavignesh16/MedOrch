import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function DrilldownPage(props: { params: Promise<{ metric: string }>, searchParams: Promise<any> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const queryString = new URLSearchParams(searchParams).toString();
  const backUrl = queryString ? `/?${queryString}` : '/';

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white capitalize">{params.metric.replace('-', ' ')} Drill-down</h1>
        <p className="text-white/60 mt-2">
          This is a placeholder page for the {params.metric} detailed view.
        </p>
        <p className="text-sm text-brand-cyan mt-4">
          Active Context: {queryString || 'None'}
        </p>
      </div>
      <Link 
        href={backUrl}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Return to Dashboard
      </Link>
    </div>
  );
}

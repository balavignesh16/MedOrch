import React from 'react';

interface DashboardFooterProps {
  recordsLoaded: number;
  datasetVersion?: string;
  environment?: string;
}

export function DashboardFooter({
  recordsLoaded,
  datasetVersion = '2.1.0',
  environment = 'Development / Demo Data',
}: DashboardFooterProps) {
  return (
    <footer className="mt-12 py-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[10px] text-white/40 uppercase tracking-wider">
      <div className="flex items-center gap-4">
        <span>Dataset Version: {datasetVersion}</span>
        <span className="hidden sm:inline">|</span>
        <span>Records Loaded: {recordsLoaded.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-4 mt-4 md:mt-0">
        <span>Environment: <span className="text-brand-teal">{environment}</span></span>
        <span className="hidden sm:inline">|</span>
        <span>Dashboard v2.0 (Executive)</span>
      </div>
    </footer>
  );
}

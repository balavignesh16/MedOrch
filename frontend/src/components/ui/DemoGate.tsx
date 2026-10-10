import React from 'react';
import { isDemoModeEnabled } from '@/lib/demoMode';
import { DemoBadge } from './DemoBadge';

interface DemoGateProps {
  /** What the dataset lacks, e.g. "beds, staff and departments". */
  missing: string;
  children: React.ReactNode;
  /** Render a compact placeholder instead of the full explanation card. */
  compact?: boolean;
}

/** Wraps a widget built on invented values: hidden (with an explanation) by default,
 * shown with a visible badge only when demo mode is enabled. */
export function DemoGate({ missing, children, compact = false }: DemoGateProps) {
  if (isDemoModeEnabled()) {
    return (
      <div className="space-y-3">
        <DemoBadge detail={`The dataset has no ${missing}.`} />
        {children}
      </div>
    );
  }
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 text-white/60 ${compact ? 'p-4 text-xs' : 'p-6 text-sm'}`}>
      <p className="font-medium text-white/80">Not available from this dataset</p>
      <p className="mt-1">
        This view would need {missing}, which the bundled hospital readmissions data does not contain. Nothing is shown
        rather than inventing numbers.
      </p>
      {!compact && (
        <p className="mt-2 text-xs text-white/40">
          Set <code className="font-mono">NEXT_PUBLIC_MEDORCH_DEMO_MODE=true</code> to preview a labelled demonstration version.
        </p>
      )}
    </div>
  );
}

import React from 'react';

export function DemoBadge({ detail }: { detail?: string }) {
  return (
    <span
      title={detail ?? 'Built on values the bundled dataset does not contain.'}
      className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-300"
    >
      Demonstration data — not from the dataset
    </span>
  );
}

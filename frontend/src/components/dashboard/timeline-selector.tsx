'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const TIMEFRAMES = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'year', label: 'Year' },
  { id: 'custom', label: 'Custom' },
];

export function TimelineSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTimeframe = searchParams.get('timeframe') || 'month';

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('timeframe', id);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex p-1 space-x-1 bg-surface-glass border border-border-glass rounded-lg w-max">
      {TIMEFRAMES.map((tf) => {
        const isActive = currentTimeframe === tf.id;
        return (
          <button
            key={tf.id}
            onClick={() => handleSelect(tf.id)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              isActive 
                ? 'bg-brand-teal/20 text-brand-teal shadow-sm' 
                : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
            }`}
          >
            {tf.label}
          </button>
        );
      })}
    </div>
  );
}

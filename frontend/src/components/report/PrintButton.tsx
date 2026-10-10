'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-xl border border-brand-teal bg-brand-teal/20 px-4 py-2 text-sm font-medium text-brand-teal hover:bg-brand-teal/30 transition-colors"
    >
      <Printer className="w-4 h-4" />
      Download PDF
    </button>
  );
}

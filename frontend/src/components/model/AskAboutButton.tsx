import React from 'react';
import Link from 'next/link';
import { Bot } from 'lucide-react';
import { buildAssistantLink } from '@/lib/assistantContext';

/** Opens the assistant with an editable, pre-filled question. Nothing is sent automatically. */
export function AskAboutButton({ prompt, label = 'Ask the assistant' }: { prompt: string; label?: string }) {
  return (
    <Link
      href={buildAssistantLink(prompt)}
      title={`Opens the assistant with this question pre-filled: "${prompt}"`}
      className="inline-flex items-center gap-1.5 rounded-full border border-brand-teal/40 bg-brand-teal/10 px-3 py-1 text-[11px] font-medium text-brand-teal hover:bg-brand-teal/20 transition-colors whitespace-nowrap"
    >
      <Bot className="w-3 h-3" />
      {label}
    </Link>
  );
}

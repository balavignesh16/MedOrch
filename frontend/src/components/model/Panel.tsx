import React from 'react';

interface PanelProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  aside?: React.ReactNode;
}

export function Panel({ title, subtitle, children, className = '', aside }: PanelProps) {
  return (
    <section className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-white/50 mt-1 max-w-2xl">{subtitle}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function ArtifactNotice({ file, command, reason }: { file: string; command?: string; reason?: string }) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
      <p className="font-medium">
        {reason ? 'This section could not be loaded.' : 'This section needs a generated artifact.'}
      </p>
      <p className="mt-1 text-amber-200/80">
        <span className="font-mono text-xs">{file}</span>
        {reason ? ` is unusable: ${reason}.` : ' was not found.'}
      </p>
      {command && (
        <p className="mt-2 text-amber-200/80">
          Generate it with: <code className="font-mono text-xs bg-black/40 px-2 py-1 rounded">{command}</code>
        </p>
      )}
      <p className="mt-2 text-xs text-amber-200/60">
        No placeholder values are shown in its place.
      </p>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] uppercase tracking-widest text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/50">{hint}</p>}
    </div>
  );
}

export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
  },
  itemStyle: { color: '#fff', fontSize: '12px' },
  labelStyle: { color: 'rgba(255,255,255,0.6)', fontSize: '12px' },
} as const;

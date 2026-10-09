import React from 'react';
import Link from 'next/link';
import { Card, CardProps } from '@/components/ui/card';
import { Info, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KpiMetadata {
  lastUpdated: string;
  dataSource: string;
  refreshPolicy: string;
  confidence: string;
  target: string;
  benchmark?: string;
  variance?: string;
}

interface KpiCardProps extends CardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  status?: 'Excellent' | 'Good' | 'Watch' | 'Critical';
  trend?: { value: number; direction: 'up' | 'down' | 'flat'; period: string };
  metadata: KpiMetadata;
  description?: string;
  href?: string;
  popoverContent?: React.ReactNode;
}

export function KpiCard({
  title,
  value,
  icon,
  status = 'Good',
  trend,
  metadata,
  description,
  href,
  popoverContent,
  widgetSize = 'md',
  className,
  ...rest
}: KpiCardProps) {
  const props = rest;

  const statusColors = {
    Excellent: 'text-success',
    Good: 'text-brand-teal',
    Watch: 'text-warning',
    Critical: 'text-danger',
  };
  
  const statusColor = statusColors[status];

  const cardContent = (
    <Card widgetSize={widgetSize} className={`flex flex-col justify-between p-5 md:p-6 relative group hover:z-50 ${className || ''}`} {...props}>
      {/* Screen Reader Only */}
      <span className="sr-only">{`KPI: ${title}. Value: ${value}. Status: ${status}.` }</span>
      
      <div className="flex justify-between items-start mb-4">
        <div className="text-xs font-bold text-white/50 uppercase tracking-[0.15em] flex items-center gap-2">
          {title}
          {/* Info Popover Hover */}
          <div className="relative group/info">
            <Info className="h-3.5 w-3.5 text-white/30 hover:text-brand-teal cursor-help transition-colors" aria-label="View Metadata" tabIndex={0} />
            <div className="absolute left-0 top-full mt-2 w-80 p-4 rounded-xl bg-surface-obsidian/95 backdrop-blur-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-300 z-20 text-xs text-white/70 space-y-3 font-medium pointer-events-none group-hover/info:pointer-events-auto group-hover/info:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/5 to-transparent rounded-xl pointer-events-none"></div>
              {popoverContent ? popoverContent : (
                <div className="relative z-10 space-y-2">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/40">Data Source</span>
                    <span className="text-white font-semibold">{metadata.dataSource}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/40">Refresh Policy</span>
                    <span className="text-white font-semibold">{metadata.refreshPolicy}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/40">Confidence</span>
                    <span className="text-brand-cyan font-semibold">{metadata.confidence}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/40">Target</span>
                    <span className="text-white font-semibold">{metadata.target}</span>
                  </div>
                  {metadata.benchmark && (
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40">Benchmark</span>
                      <span className="text-white font-semibold">{metadata.benchmark}</span>
                    </div>
                  )}
                  {metadata.variance && (
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/40">Variance</span>
                      <span className={`font-semibold ${metadata.variance.startsWith('-') ? 'text-success' : 'text-danger'}`}>
                        {metadata.variance}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1">
                    <span className="text-white/40">Last Updated</span>
                    <span className="text-brand-teal font-semibold">{metadata.lastUpdated}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={`relative flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors ${statusColor}`} aria-hidden="true">
          {/* Subtle status glow */}
          {status === 'Critical' && (
             <span className="absolute -inset-1 rounded-lg bg-danger/20 blur animate-pulse"></span>
          )}
          <div className="relative z-10">{icon}</div>
        </div>
      </div>

      <div className="mt-auto">
        <div className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter ${status === 'Critical' ? 'text-danger drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70'} mb-2`}>
          {value}
        </div>
        
        {/* Trend Indicator */}
        <div className="flex items-center gap-2 mt-2">
          {trend ? (
            <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${trend.direction === 'up' && status === 'Critical' ? 'text-danger bg-danger/10' : trend.direction === 'down' && status === 'Excellent' ? 'text-success bg-success/10' : trend.direction === 'up' ? 'text-success bg-success/10' : trend.direction === 'down' ? 'text-danger bg-danger/10' : 'text-white/60 bg-white/5'}`}>
              {trend.direction === 'up' ? <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> : trend.direction === 'down' ? <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" /> : <Minus className="h-3.5 w-3.5 mr-0.5" />}
              {trend.value}%
              <span className={`font-semibold ml-1 ${trend.direction === 'up' && status === 'Critical' ? 'text-danger/70' : trend.direction === 'down' && status === 'Excellent' ? 'text-success/70' : trend.direction === 'up' ? 'text-success/70' : trend.direction === 'down' ? 'text-danger/70' : 'text-white/40'}`}>vs {trend.period}</span>
            </div>
          ) : (
            description && <div className="text-xs font-medium text-white/40">{description}</div>
          )}
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

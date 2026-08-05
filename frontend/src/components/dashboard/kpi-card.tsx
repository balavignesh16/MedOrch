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
  const { trendDirection, ...props } = rest as any;

  const statusColors = {
    Excellent: 'text-success',
    Good: 'text-brand-teal',
    Watch: 'text-warning',
    Critical: 'text-danger',
  };

  const statusColor = statusColors[status];

  const cardContent = (
    <Card widgetSize={widgetSize} className={`flex flex-col justify-between p-4 relative group hover:z-50 ${className || ''}`} {...props}>
      {/* Screen Reader Only */}
      <span className="sr-only">{`KPI: ${title}. Value: ${value}. Status: ${status}.` }</span>
      
      <div className="flex justify-between items-start">
        <div className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1">
          {title}
          {/* Info Popover Hover */}
          <div className="relative group">
            <Info className="h-3 w-3 text-white/30 hover:text-white/80 cursor-help" aria-label="View Metadata" tabIndex={0} />
            <div className="absolute left-0 top-full mt-2 w-72 p-3 rounded-lg bg-surface-obsidian border border-border-glass shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-xs text-white/70 space-y-2">
              {popoverContent ? popoverContent : (
                <>
                  <div className="flex justify-between border-b border-white/10 pb-1">
                    <span className="text-white/50">Data Source</span>
                    <span className="text-white/90 font-medium">{metadata.dataSource}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-1">
                    <span className="text-white/50">Refresh Policy</span>
                    <span className="text-white/90 font-medium">{metadata.refreshPolicy}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-1">
                    <span className="text-white/50">Confidence</span>
                    <span className="text-brand-cyan font-medium">{metadata.confidence}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-1">
                    <span className="text-white/50">Target</span>
                    <span className="text-white/90 font-medium">{metadata.target}</span>
                  </div>
                  {metadata.benchmark && (
                    <div className="flex justify-between border-b border-white/10 pb-1">
                      <span className="text-white/50">Benchmark</span>
                      <span className="text-white/90 font-medium">{metadata.benchmark}</span>
                    </div>
                  )}
                  {metadata.variance && (
                    <div className="flex justify-between border-b border-white/10 pb-1">
                      <span className="text-white/50">Variance</span>
                      <span className={`font-medium ${metadata.variance.startsWith('-') ? 'text-success' : 'text-danger'}`}>
                        {metadata.variance}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1">
                    <span className="text-white/50">Last Updated</span>
                    <span className="text-white/90">{metadata.lastUpdated}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className={statusColor} aria-hidden="true">
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${status === 'Critical' ? 'text-danger' : 'text-white'}`}>
          {value}
        </div>
        
        {/* Trend Indicator */}
        <div className="flex items-center gap-2 mt-2">
          {trend ? (
            <div className={`flex items-center text-xs font-medium ${trend.direction === 'up' && status === 'Critical' ? 'text-danger' : trend.direction === 'down' && status === 'Excellent' ? 'text-success' : trend.direction === 'up' ? 'text-success' : trend.direction === 'down' ? 'text-danger' : 'text-white/50'}`}>
              {trend.direction === 'up' ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : trend.direction === 'down' ? <ArrowDownRight className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
              {trend.value}%
              <span className="text-white/40 font-normal ml-1">vs {trend.period}</span>
            </div>
          ) : (
            description && <div className="text-xs text-white/40">{description}</div>
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

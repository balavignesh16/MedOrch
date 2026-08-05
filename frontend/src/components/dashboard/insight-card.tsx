import React from 'react';
import { Card, CardProps } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, CheckCircle, BrainCircuit } from 'lucide-react';

interface InsightCardProps extends CardProps {
  title: string;
  level: 'Critical' | 'Warning' | 'Info' | 'Success';
  description: string;
  confidence: number;
  actionText?: string;
}

export function InsightCard({
  title,
  level,
  description,
  confidence,
  actionText,
  className,
  ...props
}: InsightCardProps) {
  const levelConfig = {
    Critical: { icon: AlertTriangle, color: 'text-danger', border: 'border-danger/30', bg: 'bg-danger/10' },
    Warning: { icon: TrendingUp, color: 'text-warning', border: 'border-warning/30', bg: 'bg-warning/10' },
    Info: { icon: BrainCircuit, color: 'text-brand-cyan', border: 'border-brand-cyan/30', bg: 'bg-brand-cyan/10' },
    Success: { icon: CheckCircle, color: 'text-success', border: 'border-success/30', bg: 'bg-success/10' },
  };

  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <Card widgetSize="xl" className={`flex flex-col md:flex-row items-start md:items-center p-4 gap-4 ${config.border} ${className || ''}`} {...props}>
      <div className={`shrink-0 p-3 rounded-full ${config.bg}`}>
        <Icon className={`h-6 w-6 ${config.color}`} />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-white font-semibold">{title}</h4>
          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
            {level}
          </span>
        </div>
        <p className="text-sm text-white/70">{description}</p>
      </div>
      
      <div className="shrink-0 flex flex-col items-end gap-2">
        <div className="text-xs text-white/50 flex items-center gap-1">
          <BrainCircuit className="h-3 w-3" />
          {confidence}% AI Confidence
        </div>
        {actionText && (
          <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors">
            {actionText}
          </button>
        )}
      </div>
    </Card>
  );
}

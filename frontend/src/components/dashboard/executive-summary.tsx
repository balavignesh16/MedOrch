import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { generateExecutiveSummary, SummaryInsight } from '@/lib/kpiLogic';

interface ExecutiveSummaryProps {
  metrics: {
    total: number;
    healthScore: number;
    readmissionRate: number;
    avgStay: number;
  };
}

export function ExecutiveSummary({ metrics }: ExecutiveSummaryProps) {
  const insights = generateExecutiveSummary(metrics);

  const getIcon = (type: SummaryInsight['type']) => {
    switch (type) {
      case 'Positive': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'Warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'Critical': return <AlertCircle className="h-4 w-4 text-danger" />;
      case 'Info': return <Info className="h-4 w-4 text-brand-cyan" />;
    }
  };

  const getBgColor = (type: SummaryInsight['type']) => {
    switch (type) {
      case 'Positive': return 'bg-success/5 border-success/10';
      case 'Warning': return 'bg-warning/5 border-warning/10';
      case 'Critical': return 'bg-danger/5 border-danger/10';
      case 'Info': return 'bg-brand-cyan/5 border-brand-cyan/10';
    }
  };

  return (
    <Card widgetSize="lg" className="flex flex-col h-full">
      <CardHeader className="pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-brand-teal" />
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
            Executive Summary
          </h3>
        </div>
      </CardHeader>
      <CardContent className="flex-1 py-4 space-y-3">
        {insights.map((insight, idx) => (
          <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${getBgColor(insight.type)}`}>
            <div className="mt-0.5 shrink-0">
              {getIcon(insight.type)}
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              {insight.text}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

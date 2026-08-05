import React from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { DollarSign, Activity, TrendingUp, AlertTriangle, Pill, ShieldCheck, FileText, ActivitySquare, ShieldAlert } from 'lucide-react';

interface FinancialKpiGridProps {
  overview: any;
}

export function FinancialKpiGrid({ overview }: FinancialKpiGridProps) {
  
  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const renderBenchmarkPopover = (current: string, target: string, benchmark: string, variance: string, whyItMatters: string) => (
    <div className="space-y-3">
      <div className="flex justify-between border-b border-white/10 pb-1">
        <span className="text-white/50">Current</span>
        <span className="text-white/90 font-bold">{current}</span>
      </div>
      <div className="flex justify-between border-b border-white/10 pb-1">
        <span className="text-white/50">Target</span>
        <span className="text-brand-cyan font-medium">{target}</span>
      </div>
      <div className="flex justify-between border-b border-white/10 pb-1">
        <span className="text-white/50">Benchmark (Regional)</span>
        <span className="text-white/70">{benchmark}</span>
      </div>
      <div className="flex justify-between border-b border-white/10 pb-1">
        <span className="text-white/50">Variance</span>
        <span className={`font-medium ${(variance.startsWith('+') && !variance.includes('Good')) ? 'text-danger' : 'text-success'}`}>
          {variance}
        </span>
      </div>
      <div className="pt-1">
        <span className="text-white/50 block mb-1 text-[10px] uppercase">Why it matters</span>
        <span className="text-white/80 text-xs leading-relaxed">{whyItMatters}</span>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Overall Score */}
      <KpiCard
        title="Financial Performance"
        value={Math.round(overview.score)}
        status={overview.score >= 90 ? 'Excellent' : overview.score >= 75 ? 'Good' : overview.score >= 60 ? 'Watch' : 'Critical'}
        icon={<ShieldCheck className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Risk Engine', refreshPolicy: 'Real-time', confidence: '99%', target: '100' }}
        popoverContent={
          <div className="space-y-2">
            <div className="flex justify-between border-b border-white/10 pb-2 mb-2">
              <span className="text-white/90 font-bold">Overall Grade</span>
              <span className={`font-bold ${overview.score >= 90 ? 'text-success' : overview.score >= 75 ? 'text-brand-teal' : overview.score >= 60 ? 'text-warning' : 'text-danger'}`}>
                {overview.score >= 90 ? 'A (Excellent)' : overview.score >= 75 ? 'B (Good)' : overview.score >= 60 ? 'C (Watch)' : 'D (Critical)'}
              </span>
            </div>
            <div className="text-white/90 font-medium border-b border-white/10 pb-2 mb-2 flex justify-between">
              <span>Score Breakdown (Max 100)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Base Score</span>
              <span className="text-success">100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Cost Efficiency Penalty</span>
              <span className="text-danger">-{overview.scoreBreakdown?.costEfficiency || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Readmission Penalty</span>
              <span className="text-danger">-{overview.scoreBreakdown?.readmission || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">ER Utilization Penalty</span>
              <span className="text-danger">-{overview.scoreBreakdown?.erUtilization || 0}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 mt-2 font-bold">
              <span className="text-white/90">Final Score</span>
              <span className="text-brand-cyan">{Math.round(overview.score)}</span>
            </div>
          </div>
        }
      />

      <KpiCard
        title="Total Cost"
        value={formatCurrency(overview.totalCost)}
        status={'Watch'}
        icon={<DollarSign className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Estimated Model', refreshPolicy: 'Real-time', confidence: '99%', target: 'N/A' }}
        popoverContent={renderBenchmarkPopover(
          formatCurrency(overview.totalCost),
          'N/A',
          'N/A',
          'N/A',
          'The aggregate estimated analytical cost based on clinical utilization multipliers.'
        )}
      />

      <KpiCard
        title="Avg Cost/Encounter"
        value={formatCurrency(overview.avgCost)}
        status={overview.avgCost > 3000 ? 'Critical' : overview.avgCost > 2000 ? 'Watch' : 'Good'}
        icon={<ActivitySquare className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Estimated Model', refreshPolicy: 'Real-time', confidence: '99%', target: '< $2,500' }}
        popoverContent={renderBenchmarkPopover(
          formatCurrency(overview.avgCost),
          '< $2,500',
          '$2,800 (Peer Group)',
          overview.avgCost > 2500 ? `+$${(overview.avgCost - 2500).toFixed(0)} over target` : `-$${(2500 - overview.avgCost).toFixed(0)} under target`,
          'Average encounter costs dictate profitability under value-based and capitated contracts.'
        )}
      />

      <KpiCard
        title="Cost Index"
        value={overview.costIndex.toString()}
        status={'Good'}
        icon={<TrendingUp className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Estimated Model', refreshPolicy: 'Real-time', confidence: '99%', target: '< 250' }}
        popoverContent={renderBenchmarkPopover(
          overview.costIndex.toString(),
          '< 250',
          '280 (National Avg)',
          'Normalized against baseline',
          'A relative index score indicating overall financial efficiency of the selected population.'
        )}
      />

      <KpiCard
        title="Readmission Cost"
        value={formatCurrency(overview.readmissionCost)}
        status={overview.readmissionCost > overview.totalCost * 0.1 ? 'Critical' : 'Good'}
        icon={<ShieldAlert className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Estimated Model', refreshPolicy: 'Real-time', confidence: '99%', target: '< 10% of total' }}
        popoverContent={renderBenchmarkPopover(
          formatCurrency(overview.readmissionCost),
          `< ${formatCurrency(overview.totalCost * 0.1)}`,
          '15% of total',
          'Excessive penalty risk',
          'Readmissions represent direct financial loss under CMS hospital readmission reduction programs.'
        )}
      />

      <KpiCard
        title="Medication Cost"
        value={formatCurrency(overview.medicationCost)}
        status={'Watch'}
        icon={<Pill className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Estimated Model', refreshPolicy: 'Real-time', confidence: '99%', target: 'N/A' }}
        popoverContent={renderBenchmarkPopover(
          formatCurrency(overview.medicationCost),
          'N/A',
          'N/A',
          'N/A',
          'High medication costs often correlate with polypharmacy and potential for adverse interactions.'
        )}
      />

      <KpiCard
        title="Emergency Cost"
        value={formatCurrency(overview.emergencyCost)}
        status={overview.emergencyCost > overview.totalCost * 0.15 ? 'Critical' : 'Watch'}
        icon={<AlertTriangle className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Estimated Model', refreshPolicy: 'Real-time', confidence: '99%', target: '< 15% of total' }}
        popoverContent={renderBenchmarkPopover(
          formatCurrency(overview.emergencyCost),
          `< ${formatCurrency(overview.totalCost * 0.15)}`,
          '18% of total',
          'Requires ED diversion',
          'Unnecessary ER utilization points to gaps in primary care accessibility.'
        )}
      />

      <KpiCard
        title="Resource Efficiency"
        value={`${100 - overview.resourceEfficiency}%`}
        status={'Excellent'}
        icon={<Activity className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Estimated Model', refreshPolicy: 'Real-time', confidence: '99%', target: '> 85%' }}
        popoverContent={renderBenchmarkPopover(
          `${100 - overview.resourceEfficiency}%`,
          '> 85%',
          '82% (Peer Group)',
          'Excellent efficiency',
          'Measures how optimally clinical resources (labs, procedures, meds) are utilized compared to peers.'
        )}
      />
    </div>
  );
}

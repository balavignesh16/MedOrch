import React from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Activity, Users, ActivitySquare, AlertTriangle, TrendingUp, Clock, FileText, CheckCircle2 } from 'lucide-react';

interface OperationalKpiGridProps {
  overview: any;
}

export function OperationalKpiGrid({ overview }: OperationalKpiGridProps) {
  
  const renderMetricPopover = (current: string, target: string, benchmark: string, variance: string, definition: string, formula: string, dataSource: string) => (
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
        <span className="text-white/50">Benchmark</span>
        <span className="text-white/70">{benchmark}</span>
      </div>
      <div className="flex justify-between border-b border-white/10 pb-1">
        <span className="text-white/50">Variance</span>
        <span className={`font-medium ${variance.includes('+') && !variance.includes('Good') && !variance.includes('Improvement') ? 'text-danger' : 'text-success'}`}>
          {variance}
        </span>
      </div>
      <div className="pt-1 space-y-2">
        <div>
          <span className="text-brand-cyan block mb-0.5 text-[10px] uppercase font-bold">Definition</span>
          <span className="text-white/80 text-xs leading-relaxed">{definition}</span>
        </div>
        <div>
          <span className="text-brand-cyan block mb-0.5 text-[10px] uppercase font-bold">Formula</span>
          <span className="text-white/60 text-xs font-mono bg-white/5 p-1 rounded">{formula}</span>
        </div>
        <div>
          <span className="text-brand-cyan block mb-0.5 text-[10px] uppercase font-bold">Data Source</span>
          <span className="text-white/80 text-xs">{dataSource}</span>
        </div>
      </div>
    </div>
  );

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A (Excellent)', color: 'text-success' };
    if (score >= 75) return { grade: 'B (Good)', color: 'text-brand-teal' };
    if (score >= 60) return { grade: 'C (Watch)', color: 'text-warning' };
    return { grade: 'D (Critical)', color: 'text-danger' };
  };

  const gradeInfo = getGrade(overview.score || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Operational Performance Score */}
      <KpiCard
        title="Operational Score"
        value={overview.score}
        status={gradeInfo.grade.split(' ')[1].replace(/[()]/g, '') as any}
        icon={<Activity className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Risk Engine', refreshPolicy: 'Real-time', confidence: '99%', target: '100' }}
        popoverContent={
          <div className="space-y-2">
            <div className="flex justify-between border-b border-white/10 pb-2 mb-2">
              <span className="text-white/90 font-bold">Overall Grade</span>
              <span className={`font-bold ${gradeInfo.color}`}>
                {gradeInfo.grade}
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
              <span className="text-white/50">Throughput Penalty</span>
              <span className="text-danger">-{overview.scoreBreakdown?.throughput || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Bed Util Penalty</span>
              <span className="text-danger">-{overview.scoreBreakdown?.bedUtilization || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">ER Load Penalty</span>
              <span className="text-danger">-{overview.scoreBreakdown?.erLoad || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">LOS Penalty</span>
              <span className="text-danger">-{overview.scoreBreakdown?.losEfficiency || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Resource Penalty</span>
              <span className="text-danger">-{overview.scoreBreakdown?.resourceEfficiency || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Workflow Penalty</span>
              <span className="text-danger">-{overview.scoreBreakdown?.workflowEfficiency || 0}</span>
            </div>
          </div>
        }
      />

      <KpiCard
        title="Avg Daily Throughput"
        value={overview.throughput.toLocaleString()}
        trend="+5.2% vs last month"
        trendDirection="up"
        status="Normal"
        icon={<Users className="h-5 w-5 text-white/70" />}
        metadata={{ lastUpdated: '10m ago', dataSource: 'ADT System', refreshPolicy: 'Hourly', confidence: '99%', target: '50/day' }}
        popoverContent={renderMetricPopover(
          overview.throughput.toString(),
          '50 patients/day',
          '45 patients/day',
          '+11.1%',
          'Average number of patients processed (admitted/discharged/transferred) per day.',
          'Total Encounters / 30',
          'ADT Feed'
        )}
      />

      <KpiCard
        title="Bed Occupancy"
        value={`${overview.bedOccupancy}%`}
        trend="+2.1% vs target"
        trendDirection="up"
        status={overview.bedOccupancy > 85 ? 'Warning' : 'Normal'}
        icon={<ActivitySquare className="h-5 w-5 text-warning" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Bed Management', refreshPolicy: 'Real-time', confidence: '98%', target: '85%' }}
        popoverContent={renderMetricPopover(
          `${overview.bedOccupancy}%`,
          '85%',
          '82%',
          '+3.6%',
          'Percentage of staffed beds currently occupied by admitted patients.',
          '(Occupied Beds / Staffed Beds) * 100',
          'EHR Bed Management Module'
        )}
      />

      <KpiCard
        title="Emergency Load"
        value={`${overview.erLoad.toFixed(1)}%`}
        trend="+4.0% vs last week"
        trendDirection="up"
        status={overview.erLoad > 20 ? 'Critical' : 'Normal'}
        icon={<AlertTriangle className={`h-5 w-5 ${overview.erLoad > 20 ? 'text-danger' : 'text-white/70'}`} />}
        metadata={{ lastUpdated: '5m ago', dataSource: 'EDIS', refreshPolicy: 'Real-time', confidence: '99%', target: '15%' }}
        popoverContent={renderMetricPopover(
          `${overview.erLoad.toFixed(1)}%`,
          '15%',
          '18%',
          `+${(overview.erLoad - 15).toFixed(1)}%`,
          'Proportion of total patient volume originating from the Emergency Department.',
          '(ER Encounters / Total Encounters) * 100',
          'ED Information System'
        )}
      />

      <KpiCard
        title="Inpatient Load"
        value={`${overview.inpatientLoad.toFixed(1)}%`}
        trend="-1.2% vs target"
        trendDirection="down"
        status="Normal"
        icon={<CheckCircle2 className="h-5 w-5 text-white/70" />}
        metadata={{ lastUpdated: '1h ago', dataSource: 'EHR', refreshPolicy: 'Daily', confidence: '99%', target: '20%' }}
        popoverContent={renderMetricPopover(
          `${overview.inpatientLoad.toFixed(1)}%`,
          '20%',
          '22%',
          `${(overview.inpatientLoad - 20).toFixed(1)}%`,
          'Proportion of total patient volume resulting in inpatient admission.',
          '(Inpatient Encounters / Total Encounters) * 100',
          'EHR Analytics'
        )}
      />

      <KpiCard
        title="Outpatient Load"
        value={`${overview.outpatientLoad.toFixed(1)}%`}
        trend="+2.5% vs target"
        trendDirection="up"
        status="Normal"
        icon={<TrendingUp className="h-5 w-5 text-white/70" />}
        metadata={{ lastUpdated: '1h ago', dataSource: 'EHR', refreshPolicy: 'Daily', confidence: '99%', target: '60%' }}
        popoverContent={renderMetricPopover(
          `${overview.outpatientLoad.toFixed(1)}%`,
          '60%',
          '58%',
          `+${(overview.outpatientLoad - 60).toFixed(1)}%`,
          'Proportion of total patient volume managed in outpatient settings.',
          '(Outpatient Encounters / Total Encounters) * 100',
          'EHR Analytics'
        )}
      />

      <KpiCard
        title="Average LOS"
        value={overview.avgLos.toFixed(1)}
        trend="+0.2d vs target"
        trendDirection="up"
        status={overview.avgLos > 5 ? 'Warning' : 'Normal'}
        icon={<Clock className="h-5 w-5 text-white/70" />}
        metadata={{ lastUpdated: 'Daily', dataSource: 'EHR', refreshPolicy: 'Nightly', confidence: '99%', target: '4.0d' }}
        popoverContent={renderMetricPopover(
          overview.avgLos.toFixed(1),
          '4.0d',
          '4.5d',
          `+${(overview.avgLos - 4.0).toFixed(1)}d`,
          'Average Length of Stay in days for admitted patients.',
          'SUM(Discharge - Admit Time) / Discharges',
          'EHR Analytics'
        )}
      />

      <KpiCard
        title="Resource Efficiency"
        value={`${overview.resourceEfficiency}%`}
        trend="-2% vs last month"
        trendDirection="down"
        status="Normal"
        icon={<FileText className="h-5 w-5 text-white/70" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'ERP', refreshPolicy: 'Hourly', confidence: '92%', target: '85%' }}
        popoverContent={renderMetricPopover(
          `${overview.resourceEfficiency}%`,
          '85%',
          '82%',
          '0%',
          'Composite index measuring optimal utilization of clinical and operational resources.',
          'Weighted Algorithm (Staff, Equipment, Beds)',
          'ERP & Scheduling System'
        )}
      />
    </div>
  );
}

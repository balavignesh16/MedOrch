import React from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Activity, Users, Clock, AlertTriangle, Pill, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

interface QualityKpiGridProps {
  overview: any;
}

export function QualityKpiGrid({ overview }: QualityKpiGridProps) {
  
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
        <span className="text-white/50">Benchmark (CMS/HEDIS)</span>
        <span className="text-white/70">{benchmark}</span>
      </div>
      <div className="flex justify-between border-b border-white/10 pb-1">
        <span className="text-white/50">Variance</span>
        <span className={`font-medium ${variance.startsWith('+') && !variance.includes('Good') ? 'text-danger' : 'text-success'}`}>
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
        title="Quality Score"
        value={overview.score}
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
              <span className="text-white/50 text-[10px] uppercase">Live</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Base Score</span>
              <span className="text-success">100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Readmission Penalty</span>
              <span className="text-danger">{overview.scoreBreakdown.readmission}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">LOS Penalty</span>
              <span className="text-danger">{overview.scoreBreakdown.los}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Medication Penalty</span>
              <span className="text-danger">{overview.scoreBreakdown.meds}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">ER Utilization Penalty</span>
              <span className="text-danger">{overview.scoreBreakdown.er}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">High Risk Penalty</span>
              <span className="text-danger">{overview.scoreBreakdown.highRisk}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 mt-2 font-bold">
              <span className="text-white/90">Final Score</span>
              <span className="text-brand-cyan">{overview.score}</span>
            </div>
          </div>
        }
      />

      <KpiCard
        title="Readmission Rate"
        value={`${overview.readmissionRate.toFixed(1)}%`}
        status={overview.readmissionRate > 15 ? 'Critical' : overview.readmissionRate > 10 ? 'Watch' : 'Good'}
        icon={<Activity className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'EMR', refreshPolicy: 'Real-time', confidence: '99%', target: '< 10%' }}
        popoverContent={renderBenchmarkPopover(
          `${overview.readmissionRate.toFixed(1)}%`,
          '< 10.0%',
          '15.2% (National Avg)',
          `${(overview.readmissionRate - 10).toFixed(1)}% from target`,
          'High readmission rates incur CMS penalties and indicate poor care transitions.'
        )}
      />

      <KpiCard
        title="Avg Length of Stay"
        value={`${overview.avgLos.toFixed(1)}d`}
        status={overview.avgLos > 5 ? 'Critical' : overview.avgLos > 4 ? 'Watch' : 'Good'}
        icon={<Clock className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'EMR', refreshPolicy: 'Real-time', confidence: '99%', target: '< 4.0d' }}
        popoverContent={renderBenchmarkPopover(
          `${overview.avgLos.toFixed(1)}d`,
          '< 4.0d',
          '4.5d (Peer Group)',
          `${(overview.avgLos - 4).toFixed(1)}d from target`,
          'Prolonged LOS increases risk of hospital-acquired infections and resource constraints.'
        )}
      />

      <KpiCard
        title="High Risk Patients"
        value={`${overview.highRiskPercent.toFixed(1)}%`}
        status={overview.highRiskPercent > 25 ? 'Critical' : 'Watch'}
        icon={<AlertTriangle className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Risk Engine', refreshPolicy: 'Real-time', confidence: '95%', target: '< 20%' }}
        popoverContent={renderBenchmarkPopover(
          `${overview.highRiskPercent.toFixed(1)}%`,
          '< 20.0%',
          '22.5% (Regional Avg)',
          `${(overview.highRiskPercent - 20).toFixed(1)}% from target`,
          'High risk patients account for 80% of preventable readmissions and excessive costs.'
        )}
      />

      <KpiCard
        title="Emergency Visits"
        value={overview.erVisits.toFixed(1)}
        status={overview.erVisits > 1.5 ? 'Critical' : 'Good'}
        icon={<Activity className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Admissions', refreshPolicy: 'Real-time', confidence: '99%', target: '< 1.0' }}
        popoverContent={renderBenchmarkPopover(
          overview.erVisits.toFixed(1),
          '< 1.0',
          '1.2 (National Avg)',
          `${(overview.erVisits - 1).toFixed(1)} from target`,
          'Frequent ER utilization suggests failed ambulatory care and primary care gaps.'
        )}
      />

      <KpiCard
        title="Avg Procedures"
        value={overview.avgProcedures.toFixed(1)}
        status={'Good'}
        icon={<FileText className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'EMR', refreshPolicy: 'Real-time', confidence: '99%', target: 'N/A' }}
        popoverContent={renderBenchmarkPopover(
          overview.avgProcedures.toFixed(1),
          'N/A',
          '1.5 (Peer Group)',
          '0.0',
          'Tracking procedures helps identify over-utilization of unnecessary surgical interventions.'
        )}
      />

      <KpiCard
        title="Avg Medications"
        value={overview.avgMeds.toFixed(1)}
        status={overview.avgMeds > 15 ? 'Critical' : 'Good'}
        icon={<Pill className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Pharmacy', refreshPolicy: 'Real-time', confidence: '99%', target: '< 10' }}
        popoverContent={renderBenchmarkPopover(
          overview.avgMeds.toFixed(1),
          '< 10.0',
          '12.5 (National Avg)',
          `${(overview.avgMeds - 10).toFixed(1)} from target`,
          'Polypharmacy increases risk of adverse drug events and readmissions, especially in elderly.'
        )}
      />

      <KpiCard
        title="Improvement Score"
        value={`+${overview.improvementScore}%`}
        status={'Excellent'}
        icon={<ArrowRight className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Analytics Engine', refreshPolicy: 'Real-time', confidence: '99%', target: '> 5%' }}
        popoverContent={renderBenchmarkPopover(
          `+${overview.improvementScore}%`,
          '> 5.0%',
          '3.0% (Peer Group)',
          `+${(overview.improvementScore - 5).toFixed(1)}% above target`,
          'Tracks quarter-over-quarter improvements in overall clinical quality metrics.'
        )}
      />
    </div>
  );
}

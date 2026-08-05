import React from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Target, ShieldCheck, Activity, Award, TrendingUp, Users } from 'lucide-react';

interface StrategyKpiGridProps {
  overview: any;
}

export function StrategyKpiGrid({ overview }: StrategyKpiGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Enterprise Readiness Score */}
      <KpiCard
        title="Enterprise Readiness"
        value={overview.readinessScore}
        status={overview.readinessScore >= 90 ? 'Excellent' : overview.readinessScore >= 75 ? 'Good' : overview.readinessScore >= 60 ? 'Watch' : 'Critical'}
        icon={<ShieldCheck className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Strategic Model', refreshPolicy: 'Real-time', confidence: '99%', target: '100' }}
        popoverContent={
          <div className="space-y-3">
            <div className="flex justify-between border-b border-white/10 pb-2 mb-2">
              <span className="text-white/90 font-bold">Enterprise Grade</span>
              <span className={`font-bold ${overview.grade === 'A' ? 'text-success' : overview.grade === 'B' ? 'text-brand-teal' : overview.grade === 'C' ? 'text-warning' : 'text-danger'}`}>
                {overview.grade}
              </span>
            </div>
            <div className="text-white/90 font-medium border-b border-white/10 pb-2 mb-2">
              <span>Readiness Breakdown (Domain Weights)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Clinical (25%)</span>
              <span className="text-white/90">{overview.breakdown.clinical}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Financial (20%)</span>
              <span className="text-white/90">{overview.breakdown.financial}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Operational (20%)</span>
              <span className="text-white/90">{overview.breakdown.operational}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Administrative (15%)</span>
              <span className="text-white/90">{overview.breakdown.administrative}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Predictive (10%)</span>
              <span className="text-white/90">{overview.breakdown.predictive}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Governance (10%)</span>
              <span className="text-white/90">{overview.breakdown.governance}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 mt-2 font-bold">
              <span className="text-white/90">Final Score</span>
              <span className="text-brand-cyan">{overview.readinessScore}</span>
            </div>
          </div>
        }
      />

      <KpiCard
        title="Organization Health"
        value={overview.organizationHealth}
        status={'Excellent'}
        icon={<Activity className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Strategic Model', refreshPolicy: 'Real-time', confidence: '99%', target: 'Stable' }}
        popoverContent={
          <div className="p-2">
            <p className="text-sm text-white/80">Current organizational stability index reflects optimal clinical and financial governance models in place.</p>
          </div>
        }
      />

      <KpiCard
        title="Performance Index"
        value={overview.performanceIndex}
        status={'Good'}
        icon={<TrendingUp className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Strategic Model', refreshPolicy: 'Real-time', confidence: '99%', target: '> 80' }}
        popoverContent={
          <div className="p-2">
            <p className="text-sm text-white/80">Composite performance index tracking overall execution against enterprise strategic objectives.</p>
          </div>
        }
      />

      <KpiCard
        title="Benchmark Score"
        value={overview.benchmarkScore}
        status={'Watch'}
        icon={<Target className="h-5 w-5" />}
        metadata={{ lastUpdated: 'Live', dataSource: 'Strategic Model', refreshPolicy: 'Real-time', confidence: '99%', target: '> 85' }}
        popoverContent={
          <div className="p-2">
            <p className="text-sm text-white/80">Aggregated benchmark standing compared to regional peer institutions and national best practices.</p>
          </div>
        }
      />
    </div>
  );
}

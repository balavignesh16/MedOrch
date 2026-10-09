'use client';

import React from 'react';
import { FilterChips } from '@/components/dashboard/filter-chips';
import { StrategyKpiGrid } from '@/components/strategy/strategy-kpi-grid';
import { EnterpriseBenchmarkProfiles } from '@/components/strategy/enterprise-benchmark-profiles';
import { StrategicKpiMatrix } from '@/components/strategy/strategic-kpi-matrix';
import { ScenarioSimulator } from '@/components/strategy/scenario-simulator';
import { DecisionPrioritizationMatrix } from '@/components/strategy/decision-prioritization-matrix';
import { StrategicRoadmap } from '@/components/strategy/strategic-roadmap';
import { ExecutiveBrief } from '@/components/strategy/executive-brief';
import type {
  getDecisionPrioritizationMatrix,
  getEnterpriseBenchmarkProfiles,
  getStrategicExecutiveBrief,
  getStrategicKpiMatrix,
  getStrategicOverview,
  getStrategicRoadmap,
} from '@/app/actions/strategyDb';

interface DashboardClientProps {
  overviewData: Awaited<ReturnType<typeof getStrategicOverview>>;
  benchmarkData: Awaited<ReturnType<typeof getEnterpriseBenchmarkProfiles>>;
  kpiMatrixData: Awaited<ReturnType<typeof getStrategicKpiMatrix>>;
  decisionMatrixData: Awaited<ReturnType<typeof getDecisionPrioritizationMatrix>>;
  roadmapData: Awaited<ReturnType<typeof getStrategicRoadmap>>;
  executiveBriefData: Awaited<ReturnType<typeof getStrategicExecutiveBrief>>;
}

export function DashboardClient({
  overviewData,
  benchmarkData,
  kpiMatrixData,
  decisionMatrixData,
  roadmapData,
  executiveBriefData
}: DashboardClientProps) {
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <FilterChips  />
      
      {/* Top Section: KPIs */}
      <StrategyKpiGrid overview={overviewData} />

      {/* Executive Brief */}
      <ExecutiveBrief insights={executiveBriefData} />

      {/* Middle Section: Matrices and Simulators */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
        <StrategicKpiMatrix data={kpiMatrixData} />
        <ScenarioSimulator />
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
        <EnterpriseBenchmarkProfiles data={benchmarkData} />
        <DecisionPrioritizationMatrix data={decisionMatrixData} />
      </div>

      {/* Bottom Section: Roadmap */}
      <StrategicRoadmap data={roadmapData} />
    </div>
  );
}

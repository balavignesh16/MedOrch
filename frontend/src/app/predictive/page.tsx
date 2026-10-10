import React from 'react';
import { getDb } from '@/lib/analytics/cache';
import {
  loadReadmissionExplanations,
  loadReadmissionFairness,
  loadReadmissionMetrics,
} from '@/lib/ml/modelArtifacts';
import { getHighRiskEncounters, getRiskSummary } from '@/lib/ml/predictiveData';
import type { HighRiskEncounter, RiskSummary } from '@/lib/ml/predictiveData';
import { ArtifactNotice } from '@/components/model/Panel';
import { ModelCard } from '@/components/model/ModelCard';
import { CurvesPanel } from '@/components/model/CurvesPanel';
import { ThresholdExplorer } from '@/components/model/ThresholdExplorer';
import { ImportanceChart } from '@/components/model/ImportanceChart';
import { FairnessTable } from '@/components/model/FairnessTable';
import { RiskDistribution } from '@/components/model/RiskDistribution';
import { HighRiskTable } from '@/components/model/HighRiskTable';
import { ScenarioCalculator } from '@/components/model/ScenarioCalculator';

export const dynamic = 'force-dynamic';

function loadScoredData(): { encounters: HighRiskEncounter[]; summary: RiskSummary } {
  try {
    const db = getDb();
    return { encounters: getHighRiskEncounters(db, 50), summary: getRiskSummary(db) };
  } catch (error) {
    console.error('Failed to read scored encounters:', error);
    return { encounters: [], summary: { scoredEncounters: 0, meanPredictedRisk: null, observedWithin30DayRate: null, bins: [] } };
  }
}

export default function PredictivePage() {
  const metrics = loadReadmissionMetrics();
  const explanations = loadReadmissionExplanations();
  const fairness = loadReadmissionFairness();
  const { encounters, summary } = loadScoredData();

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">Predictive Analytics</h2>
        <p className="text-white/50 text-sm mt-2 max-w-3xl">
          A 30-day readmission risk model trained on historical, de-identified encounter data (UCI Diabetes 130-US
          Hospitals, 1999–2008). Every number here comes from the model&apos;s saved evaluation or the scored database. This
          is a teaching demonstration, not a clinically validated tool.
        </p>
      </header>

      {metrics.status === 'ok' ? (
        <>
          <ModelCard metrics={metrics.data} />
          <CurvesPanel metrics={metrics.data} />
          <ThresholdExplorer metrics={metrics.data} />
        </>
      ) : (
        <ArtifactNotice
          file={metrics.file}
          command={metrics.status === 'missing' ? metrics.command : undefined}
          reason={metrics.status === 'invalid' ? metrics.reason : undefined}
        />
      )}

      {explanations.status === 'ok' ? (
        <ImportanceChart explanations={explanations.data} />
      ) : (
        <ArtifactNotice
          file={explanations.file}
          command={explanations.status === 'missing' ? explanations.command : undefined}
          reason={explanations.status === 'invalid' ? explanations.reason : undefined}
        />
      )}

      {fairness.status === 'ok' ? (
        <FairnessTable fairness={fairness.data} />
      ) : (
        <ArtifactNotice
          file={fairness.file}
          command={fairness.status === 'missing' ? fairness.command : undefined}
          reason={fairness.status === 'invalid' ? fairness.reason : undefined}
        />
      )}

      <RiskDistribution
        summary={summary}
        operatingThreshold={metrics.status === 'ok' ? metrics.data.operating_threshold : undefined}
        topDecileThreshold={metrics.status === 'ok' ? metrics.data.thresholds.top_decile : undefined}
      />

      <ScenarioCalculator
        heldOutTopDecileRecall={metrics.status === 'ok' ? metrics.data.threshold_analysis.top_decile.recall : undefined}
      />

      <HighRiskTable encounters={encounters} />
    </div>
  );
}

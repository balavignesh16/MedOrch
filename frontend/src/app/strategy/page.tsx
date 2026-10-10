import React from 'react';
import { getDb } from '@/lib/analytics/cache';
import { loadIdMappings } from '@/lib/idMappings';
import { buildOperationsFindings, getOperationsData } from '@/lib/operationsData';
import { buildExecutiveFindings, getHeadlineKpis, type HeadlineKpis } from '@/lib/executiveSummary';
import {
  loadDataQuality,
  loadHba1cStudy,
  loadReadmissionExplanations,
  loadReadmissionFairness,
  loadReadmissionMetrics,
  type ArtifactResult,
} from '@/lib/ml/modelArtifacts';
import { ExecutiveSummaryView } from '@/components/strategy/ExecutiveSummaryView';

export const dynamic = 'force-dynamic';

const dataOrNull = <T,>(result: ArtifactResult<T>): T | null => (result.status === 'ok' ? result.data : null);

export default function StrategyPage() {
  let kpis: HeadlineKpis | null = null;
  let operationsFindings: string[] = [];
  try {
    const db = getDb();
    kpis = getHeadlineKpis(db);
    operationsFindings = buildOperationsFindings(getOperationsData(db, {}, loadIdMappings()));
  } catch (error) {
    console.error('Failed to compute executive summary inputs:', error);
  }

  const findings = buildExecutiveFindings({
    metrics: dataOrNull(loadReadmissionMetrics()),
    study: dataOrNull(loadHba1cStudy()),
    fairness: dataOrNull(loadReadmissionFairness()),
    explanations: dataOrNull(loadReadmissionExplanations()),
    quality: dataOrNull(loadDataQuality()),
    operationsFindings,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">Executive Evidence Summary</h2>
        <p className="text-white/50 text-sm mt-2 max-w-3xl">
          What this analysis found, in one place: headline measures from the data, and the key results of the model, the
          HbA1c study, the fairness audit and the data-quality review, each traceable to its source page.
        </p>
      </header>
      {kpis ? (
        <ExecutiveSummaryView kpis={kpis} findings={findings} />
      ) : (
        <p className="text-sm text-amber-300">The summary is unavailable: the database could not be read.</p>
      )}
    </div>
  );
}

import React from 'react';
import { loadHba1cStudy } from '@/lib/ml/modelArtifacts';
import { ArtifactNotice } from '@/components/model/Panel';
import { Hba1cStudyView } from '@/components/research/Hba1cStudyView';
import { CohortComparisonTool } from '@/components/research/CohortComparisonTool';
import { MedicationAnalyticsView } from '@/components/research/MedicationAnalyticsView';
import { getDb } from '@/lib/analytics/cache';
import { getMedicationAnalytics, type MedicationAnalytics } from '@/lib/ml/medicationAnalytics';

export const dynamic = 'force-dynamic';

function loadMedicationAnalytics(): MedicationAnalytics | null {
  try {
    return getMedicationAnalytics(getDb());
  } catch (error) {
    console.error('Failed to compute medication analytics:', error);
    return null;
  }
}

export default function ResearchPage() {
  const study = loadHba1cStudy();
  const medications = loadMedicationAnalytics();

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">Research</h2>
        <p className="text-white/50 text-sm mt-2 max-w-3xl">
          Inferential statistics on historical, de-identified encounters: a replication-style analysis of a published
          question about HbA1c testing, and a tool for testing differences between any two cohorts. These results show
          associations in observational data, not causal effects.
        </p>
      </header>

      {study.status === 'ok' ? (
        <Hba1cStudyView study={study.data} />
      ) : (
        <ArtifactNotice
          file={study.file}
          command={study.status === 'missing' ? study.command : undefined}
          reason={study.status === 'invalid' ? study.reason : undefined}
        />
      )}

      {medications ? (
        <MedicationAnalyticsView analytics={medications} />
      ) : (
        <p className="text-sm text-amber-300">Medication analytics are unavailable: the database could not be read.</p>
      )}

      <CohortComparisonTool />
    </div>
  );
}

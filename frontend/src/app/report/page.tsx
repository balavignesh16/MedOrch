import React from 'react';
import {
  loadDataQuality,
  loadHba1cStudy,
  loadReadmissionExplanations,
  loadReadmissionFairness,
  loadReadmissionMetrics,
  type ArtifactResult,
} from '@/lib/ml/modelArtifacts';
import { ReportDocument } from '@/components/report/ReportDocument';
import { PrintButton } from '@/components/report/PrintButton';

export const dynamic = 'force-dynamic';

function dataOrNull<T>(result: ArtifactResult<T>, name: string, missing: string[]): T | null {
  if (result.status === 'ok') return result.data;
  missing.push(name);
  return null;
}

export default function ReportPage() {
  const missing: string[] = [];
  const metrics = dataOrNull(loadReadmissionMetrics(), 'model metrics', missing);
  const explanations = dataOrNull(loadReadmissionExplanations(), 'SHAP explanations', missing);
  const fairness = dataOrNull(loadReadmissionFairness(), 'fairness audit', missing);
  const study = dataOrNull(loadHba1cStudy(), 'HbA1c study', missing);
  const quality = dataOrNull(loadDataQuality(), 'data quality profile', missing);

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <div className="no-print flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Analysis Report</h2>
          <p className="text-white/50 text-sm mt-2 max-w-2xl">
            A single printable document assembled from the saved model evaluation, fairness audit, HbA1c study and data-quality
            profile. Use Download PDF and choose &ldquo;Save as PDF&rdquo; in the print dialog.
          </p>
        </div>
        <PrintButton />
      </div>
      <ReportDocument
        metrics={metrics}
        explanations={explanations}
        fairness={fairness}
        study={study}
        quality={quality}
        missing={missing}
      />
    </div>
  );
}

import React from 'react';
import { loadDataQuality } from '@/lib/ml/modelArtifacts';
import { ArtifactNotice } from '@/components/model/Panel';
import { DataQualityView } from '@/components/research/DataQualityView';

export const dynamic = 'force-dynamic';

export default function DataQualityPage() {
  const profile = loadDataQuality();

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-8">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">Data Quality &amp; Lineage</h2>
        <p className="text-white/50 text-sm mt-2 max-w-3xl">
          What the dataset contains, what is missing, what was excluded and why, and how each number in this application
          traces back to the source file. Computed from the raw CSV and cross-checked against the analytics database.
        </p>
      </header>

      {profile.status === 'ok' ? (
        <DataQualityView profile={profile.data} />
      ) : (
        <ArtifactNotice
          file={profile.file}
          command={profile.status === 'missing' ? profile.command : undefined}
          reason={profile.status === 'invalid' ? profile.reason : undefined}
        />
      )}
    </div>
  );
}

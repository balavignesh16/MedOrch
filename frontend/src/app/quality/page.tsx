import React from 'react';
import { QualityFilterState } from '@/lib/qualityLogic';
import {
  getQualityOverview,
  getReadmissionIntelligence,
  getLengthOfStayAnalytics,
  getMedicationQuality,
  getEmergencyInpatientAnalytics,
  getClinicalRisk,
  getQualityInsights,
  getQualityTrends
} from '@/app/actions/qualityDb';

import { QualityKpiGrid } from '@/components/quality/quality-kpi-grid';
import { ReadmissionIntelligence } from '@/components/quality/readmission-intelligence';
import { LosAnalytics } from '@/components/quality/los-analytics';
import { MedicationQuality } from '@/components/quality/medication-quality';
import { UtilizationAnalysis } from '@/components/quality/utilization-analysis';
import { ClinicalRiskDashboard } from '@/components/quality/clinical-risk-dashboard';
import { QualityInsights } from '@/components/quality/quality-insights';
import { ClinicalTimeline } from '@/components/quality/clinical-timeline';

interface QualityPageProps {
  searchParams: Promise<QualityFilterState>;
}

export default async function QualityPage(props: QualityPageProps) {
  const searchParams = await props.searchParams;
  const filters = searchParams;

  // Execute all queries in parallel for maximum performance (React Cache will dedup if necessary)
  const [
    overview,
    readmissionData,
    losData,
    medsData,
    utilizationData,
    clinicalRiskData,
    insightsData,
    trendsData
  ] = await Promise.all([
    getQualityOverview(filters),
    getReadmissionIntelligence(filters),
    getLengthOfStayAnalytics(filters),
    getMedicationQuality(filters),
    getEmergencyInpatientAnalytics(filters),
    getClinicalRisk(filters),
    getQualityInsights(filters),
    getQualityTrends(filters)
  ]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Section: KPIs and Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        <div className="xl:col-span-3">
          <QualityKpiGrid overview={overview} />
          <ClinicalRiskDashboard data={clinicalRiskData} />
        </div>
        <div className="xl:col-span-1">
          <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Actionable Insights</h3>
          <QualityInsights insights={insightsData} />
        </div>
      </div>

      {/* Main Analysis Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ReadmissionIntelligence data={readmissionData} totalPatients={overview.totalPatients} />
          <MedicationQuality data={medsData} />
        </div>
        <div className="space-y-6">
          <LosAnalytics data={losData} />
          <UtilizationAnalysis data={utilizationData} totalEncounters={overview.totalPatients} />
        </div>
      </div>

      {/* Timeline view at the bottom */}
      <div className="mt-6">
        <ClinicalTimeline data={trendsData} />
      </div>
    </div>
  );
}

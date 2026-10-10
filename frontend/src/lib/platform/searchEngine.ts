import type { PlatformSearchResult } from './platformTypes';
import { QueryFactory } from '@/lib/analytics/queryFactory';

interface PageEntry {
  title: string;
  module: string;
  url: string;
  type: PlatformSearchResult['type'];
  keywords: string[];
}

/** A real index of what each page contains. Deliberately holds no figures: numbers come from the pages themselves. */
export const PAGE_INDEX: PageEntry[] = [
  { title: 'Executive summary', module: 'Executive Summary', url: '/strategy', type: 'Dashboard', keywords: ['findings', 'targets', 'kpi', 'overview'] },
  { title: 'Operational overview', module: 'Operations', url: '/operations', type: 'Dashboard', keywords: ['operations', 'throughput'] },
  { title: 'Admission mix and sources', module: 'Operations', url: '/operations', type: 'Insight', keywords: ['admission', 'emergency', 'referral'] },
  { title: 'Length of stay', module: 'Operations', url: '/operations', type: 'KPI', keywords: ['los', 'days', 'stay'] },
  { title: 'Discharge destinations', module: 'Operations', url: '/operations', type: 'Insight', keywords: ['discharge', 'home', 'snf', 'rehab'] },
  { title: 'Readmission by prior visits', module: 'Operations', url: '/operations', type: 'Insight', keywords: ['prior', 'inpatient', 'emergency', 'readmission'] },
  { title: 'Population health', module: 'Population Health', url: '/population', type: 'Dashboard', keywords: ['cohort', 'demographics', 'age', 'race', 'gender'] },
  { title: 'Clinical quality', module: 'Clinical Quality', url: '/quality', type: 'Dashboard', keywords: ['quality', 'readmission', 'risk'] },
  { title: 'Financial estimates', module: 'Financial Intelligence', url: '/financial', type: 'Dashboard', keywords: ['cost', 'estimate', 'financial'] },
  { title: 'Readmission risk model card', module: 'Predictive Analytics', url: '/predictive', type: 'Prediction', keywords: ['model', 'auc', 'roc', 'calibration', 'threshold'] },
  { title: 'Fairness audit', module: 'Predictive Analytics', url: '/predictive', type: 'Insight', keywords: ['fairness', 'bias', 'subgroup', 'race', 'gender', 'age'] },
  { title: 'Feature importance (SHAP)', module: 'Predictive Analytics', url: '/predictive', type: 'Insight', keywords: ['shap', 'drivers', 'importance', 'explain'] },
  { title: 'Highest-risk encounters', module: 'Predictive Analytics', url: '/predictive', type: 'Prediction', keywords: ['high risk', 'risk score'] },
  { title: 'Intervention scenario calculator', module: 'Predictive Analytics', url: '/predictive', type: 'Prediction', keywords: ['scenario', 'what-if', 'capacity'] },
  { title: 'HbA1c and readmission study', module: 'Research & Statistics', url: '/research', type: 'Insight', keywords: ['hba1c', 'a1c', 'strack', 'odds ratio', 'study'] },
  { title: 'Medication patterns', module: 'Research & Statistics', url: '/research', type: 'Insight', keywords: ['insulin', 'medication', 'drug', 'dose'] },
  { title: 'Compare two cohorts', module: 'Research & Statistics', url: '/research', type: 'Insight', keywords: ['compare', 'chi-square', 't-test', 'statistics'] },
  { title: 'Missing data and exclusions', module: 'Data Quality', url: '/data-quality', type: 'Insight', keywords: ['missing', 'weight', 'payer', 'exclusion'] },
  { title: 'Data lineage and definitions', module: 'Data Quality', url: '/data-quality', type: 'Insight', keywords: ['lineage', 'definition', 'source'] },
  { title: 'Analysis report (PDF)', module: 'Analysis Report', url: '/report', type: 'Report', keywords: ['report', 'pdf', 'print'] },
  { title: 'Ask the analytics assistant', module: 'Analytics Assistant', url: '/assistant', type: 'Dashboard', keywords: ['assistant', 'chat', 'question', 'sql'] },
];

export function searchPages(query: string): PlatformSearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return PAGE_INDEX.filter(
    (entry) =>
      entry.title.toLowerCase().includes(q) ||
      entry.module.toLowerCase().includes(q) ||
      entry.keywords.some((keyword) => keyword.includes(q) || q.includes(keyword)),
  ).map((entry, index) => ({ id: `page-${index}`, type: entry.type, title: entry.title, module: entry.module, url: entry.url }));
}

export function performGlobalSearch(query: string): PlatformSearchResult[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();
  const results: PlatformSearchResult[] = [];

  if (/^\d+$/.test(q)) {
    try {
      const patients = QueryFactory.executeCustomQuery<Array<{ patient_nbr: number | string }>>(
        `SELECT DISTINCT patient_nbr FROM hospital_readmissions WHERE CAST(patient_nbr AS TEXT) LIKE ? LIMIT 5`,
        [`%${q}%`],
        [],
      );
      if (Array.isArray(patients)) {
        patients.forEach((p, i) => {
          results.push({
            id: `p${i}`,
            type: 'Patient',
            title: `Patient ${p.patient_nbr}`,
            subtitle: `MRN: ${p.patient_nbr}`,
            module: 'Population Health',
            url: `/population/patient/${p.patient_nbr}`,
          });
        });
      }
    } catch (error) {
      console.error('Search DB Error:', error);
    }
  }

  return [...results, ...searchPages(q)];
}

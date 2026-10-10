import type Database from 'better-sqlite3';
import type { DataQualityProfile } from '@/lib/ml/dataQualityTypes';
import type { ReadmissionExplanations, ReadmissionFairness, ReadmissionMetrics } from '@/lib/ml/modelArtifactTypes';
import { humanizeFeature } from '@/lib/ml/modelArtifactViews';
import type { Hba1cStudy } from '@/lib/ml/studyArtifactTypes';
import { formatPValue } from '@/lib/ml/studyViews';

export interface HeadlineKpis {
  encounters: number;
  patients: number;
  thirtyDayRate: number;
  anyReadmissionRate: number;
  meanLos: number | null;
  hba1cTestedShare: number;
}

export function getHeadlineKpis(db: Database.Database): HeadlineKpis {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n, COUNT(DISTINCT patient_nbr) AS patients, AVG(time_in_hospital) AS los,
              COALESCE(SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END), 0) AS within30,
              COALESCE(SUM(CASE WHEN readmitted != 'NO' THEN 1 ELSE 0 END), 0) AS anyr,
              COALESCE(SUM(CASE WHEN a1cresult IS NOT NULL THEN 1 ELSE 0 END), 0) AS tested
         FROM hospital_readmissions`,
    )
    .get() as { n: number; patients: number; los: number | null; within30: number; anyr: number; tested: number };
  return {
    encounters: row.n,
    patients: row.patients,
    thirtyDayRate: row.n ? row.within30 / row.n : 0,
    anyReadmissionRate: row.n ? row.anyr / row.n : 0,
    meanLos: row.los,
    hba1cTestedShare: row.n ? row.tested / row.n : 0,
  };
}

export type FindingSource = 'Model' | 'HbA1c study' | 'Fairness' | 'Drivers' | 'Data quality' | 'Operations';

export interface Finding {
  source: FindingSource;
  text: string;
}

export interface FindingInputs {
  metrics: ReadmissionMetrics | null;
  study: Hba1cStudy | null;
  fairness: ReadmissionFairness | null;
  explanations: ReadmissionExplanations | null;
  quality: DataQualityProfile | null;
  operationsFindings: string[];
}

const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

export function modelFinding(metrics: ReadmissionMetrics): Finding {
  const op = metrics.threshold_analysis.max_f1;
  return {
    source: 'Model',
    text:
      `The 30-day readmission model has a held-out ROC-AUC of ${metrics.roc_auc.toFixed(3)} (95% CI ${metrics.roc_auc_ci95[0].toFixed(3)}–${metrics.roc_auc_ci95[1].toFixed(3)}), ` +
      `a modest discrimination typical for this dataset. At its operating threshold it catches ${pct(op.recall)} of 30-day readmissions with ${pct(op.precision)} precision, ` +
      `flagging ${pct(op.flagged_fraction)} of encounters. It is a demonstration, not a clinical tool.`,
  };
}

export function studyFinding(study: Hba1cStudy): Finding {
  const exposures = study.adjusted_model.exposure_odds_ratios;
  const significant = exposures.filter((row) => row.p_value < 0.05);
  const range = `adjusted odds ratios ${Math.min(...exposures.map((r) => r.odds_ratio)).toFixed(2)}–${Math.max(...exposures.map((r) => r.odds_ratio)).toFixed(2)} versus not measured`;
  const interaction = study.interaction['significant_at_0.05']
    ? `The association differs by primary diagnosis (p ${formatPValue(study.interaction.p_value)}).`
    : 'No significant difference by primary diagnosis was detected.';
  return {
    source: 'HbA1c study',
    text:
      `HbA1c measurement and 30-day readmission: ${range}; ${significant.length} of ${exposures.length} measured groups are individually significant at p < 0.05. ` +
      `${study.paper_comparison.assessment} ${interaction}`,
  };
}

export function fairnessFindings(fairness: ReadmissionFairness): Finding[] {
  const findings: Finding[] = [];
  for (const [attribute, section] of Object.entries(fairness.attributes)) {
    for (const [metric, gap] of Object.entries(section.gaps)) {
      if (!gap || !gap.flagged) continue;
      const name = attribute.replace('_', ' ');
      const metricLabel = metric === 'recall' ? 'recall' : 'false-positive rate';
      findings.push({
        source: 'Fairness',
        text:
          `By ${name}, ${metricLabel} ranges from ${gap.lowest_value.toFixed(2)} (${gap.lowest_group}) to ${gap.highest_value.toFixed(2)} (${gap.highest_group}), ` +
          `a gap above the ${fairness.gap_review_threshold.toFixed(2)} review threshold` +
          (gap.intervals_overlap ? ', but the groups\' intervals overlap so it may be sampling noise.' : ' and the intervals do not overlap.'),
      });
    }
  }
  if (findings.length === 0) findings.push({ source: 'Fairness', text: 'No subgroup gap exceeded the review threshold.' });
  return findings;
}

export function driversFinding(explanations: ReadmissionExplanations): Finding {
  const top = explanations.global_importance.slice(0, 3).map((entry) => humanizeFeature(entry.feature));
  return { source: 'Drivers', text: `The model's three most influential features are ${top.join(', ')} (SHAP). Importance describes the model, not causes.` };
}

export function dataQualityFindings(quality: DataQualityProfile): Finding[] {
  const worst = [...quality.missingness].filter((row) => row.missing_percent > 0).sort((a, b) => b.missing_percent - a.missing_percent)[0];
  const notPerformed = quality.missingness.filter((row) => row.not_performed_percent > 50);
  const findings: Finding[] = [];
  if (worst) findings.push({ source: 'Data quality', text: `${worst.column} is missing for ${worst.missing_percent.toFixed(1)}% of encounters${worst.in_database ? '' : ' and was excluded from the database'}.` });
  for (const row of notPerformed) {
    const consequence = row.column.toLowerCase() === 'a1cresult' ? 'which limits any HbA1c analysis' : 'so results that depend on it describe only the tested minority';
    findings.push({ source: 'Data quality', text: `${row.column} was not performed for ${row.not_performed_percent.toFixed(1)}% of encounters, ${consequence}.` });
  }
  findings.push({
    source: 'Data quality',
    text: `${quality.repeat_patients.patients_with_multiple_encounters.toLocaleString('en-US')} of ${quality.repeat_patients.patients.toLocaleString('en-US')} patients have repeat encounters, so records are not independent.`,
  });
  return findings;
}

export function buildExecutiveFindings(inputs: FindingInputs): Finding[] {
  const findings: Finding[] = [];
  if (inputs.metrics) findings.push(modelFinding(inputs.metrics));
  if (inputs.study) findings.push(studyFinding(inputs.study));
  if (inputs.fairness) findings.push(...fairnessFindings(inputs.fairness));
  if (inputs.explanations) findings.push(driversFinding(inputs.explanations));
  if (inputs.quality) findings.push(...dataQualityFindings(inputs.quality));
  for (const text of inputs.operationsFindings.slice(0, 3)) findings.push({ source: 'Operations', text });
  return findings;
}

export type TargetDirection = 'lower-is-better' | 'higher-is-better';

export interface TargetEvaluation {
  status: 'no-target' | 'meets' | 'misses';
  gap: number | null;
}

/** gap is current minus target; positive means above the target. */
export function evaluateTarget(current: number, targetText: string, direction: TargetDirection): TargetEvaluation {
  const trimmed = targetText.trim();
  if (trimmed === '') return { status: 'no-target', gap: null };
  const target = Number(trimmed);
  if (!Number.isFinite(target)) return { status: 'no-target', gap: null };
  const gap = current - target;
  const meets = direction === 'lower-is-better' ? current <= target : current >= target;
  return { status: meets ? 'meets' : 'misses', gap };
}

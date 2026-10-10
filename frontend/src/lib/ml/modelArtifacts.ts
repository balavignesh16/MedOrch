import { existsSync, readFileSync } from 'fs';
import path from 'path';
import type {
  ReadmissionExplanations,
  ReadmissionFairness,
  ReadmissionMetrics,
} from './modelArtifactTypes';
import type { DataQualityProfile } from './dataQualityTypes';
import type { Hba1cStudy } from './studyArtifactTypes';

export type ArtifactResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'missing'; file: string; command: string }
  | { status: 'invalid'; file: string; reason: string };

type ArtifactDirectory = 'ml' | 'analysis';

export function getEngineRoot(): string {
  const configured = process.env.MEDORCH_ENGINE_DIR;
  if (configured) return path.resolve(configured);
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), '..', 'engine');
}

export function artifactPath(directory: ArtifactDirectory, filename: string): string {
  return path.join(getEngineRoot(), directory, 'artifacts', filename);
}

export function loadArtifact<T>(
  directory: ArtifactDirectory,
  filename: string,
  command: string,
  guard: (value: unknown) => string | null,
): ArtifactResult<T> {
  const file = artifactPath(directory, filename);
  if (!existsSync(file)) return { status: 'missing', file: `engine/${directory}/artifacts/${filename}`, command };
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf-8'));
    const problem = guard(parsed);
    if (problem) return { status: 'invalid', file: `engine/${directory}/artifacts/${filename}`, reason: problem };
    return { status: 'ok', data: parsed as T };
  } catch (error) {
    return {
      status: 'invalid',
      file: `engine/${directory}/artifacts/${filename}`,
      reason: error instanceof Error ? error.message : 'Unreadable JSON',
    };
  }
}

export function requireKeys(value: unknown, keys: string[]): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return 'Expected a JSON object';
  const record = value as Record<string, unknown>;
  const missing = keys.filter((key) => !(key in record));
  return missing.length ? `Missing keys: ${missing.join(', ')}` : null;
}

const METRIC_KEYS = [
  'model_version', 'roc_auc', 'pr_auc', 'roc_auc_ci95', 'pr_auc_ci95', 'threshold_analysis',
  'roc_curve', 'pr_curve', 'calibration_curve', 'cohort', 'operating_threshold', 'known_limitations',
];

export function loadReadmissionMetrics(): ArtifactResult<ReadmissionMetrics> {
  return loadArtifact(
    'ml',
    'readmission_risk_metrics.json',
    'python -m engine.ml.train_readmission_model',
    (value) => requireKeys(value, METRIC_KEYS),
  );
}

export function loadReadmissionExplanations(): ArtifactResult<ReadmissionExplanations> {
  return loadArtifact(
    'ml',
    'readmission_risk_explanations.json',
    'python -m engine.ml.explain_model',
    (value) => requireKeys(value, ['model_version', 'global_importance', 'score_scale']),
  );
}

export function loadReadmissionFairness(): ArtifactResult<ReadmissionFairness> {
  return loadArtifact(
    'ml',
    'readmission_risk_fairness.json',
    'python -m engine.ml.fairness_audit',
    (value) => requireKeys(value, ['model_version', 'attributes', 'caveat']),
  );
}

export function loadHba1cStudy(): ArtifactResult<Hba1cStudy> {
  return loadArtifact(
    'analysis',
    'hba1c_study.json',
    'python -m engine.analysis.hba1c_study',
    (value) => requireKeys(value, ['cohort_flow', 'group_rates', 'chi_square', 'adjusted_model', 'interaction', 'paper_comparison']),
  );
}

export function loadDataQuality(): ArtifactResult<DataQualityProfile> {
  return loadArtifact(
    'analysis',
    'data_quality.json',
    'python -m engine.analysis.data_quality',
    (value) => requireKeys(value, ['missingness', 'repeat_patients', 'outcome_balance', 'definitions', 'lineage', 'database_consistency']),
  );
}

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  artifactPath,
  loadReadmissionExplanations,
  loadReadmissionFairness,
  loadReadmissionMetrics,
  requireKeys,
} from './modelArtifacts';

let engineDir = '';

function writeArtifact(directory: 'ml' | 'analysis', filename: string, content: unknown): void {
  const target = path.join(engineDir, directory, 'artifacts');
  mkdirSync(target, { recursive: true });
  writeFileSync(path.join(target, filename), typeof content === 'string' ? content : JSON.stringify(content));
}

beforeEach(() => {
  engineDir = mkdtempSync(path.join(tmpdir(), 'medorch-artifacts-'));
  process.env.MEDORCH_ENGINE_DIR = engineDir;
});

afterEach(() => {
  delete process.env.MEDORCH_ENGINE_DIR;
  rmSync(engineDir, { recursive: true, force: true });
});

const validMetrics = {
  model_version: 'v-test',
  roc_auc: 0.67,
  pr_auc: 0.23,
  roc_auc_ci95: [0.65, 0.68],
  pr_auc_ci95: [0.21, 0.25],
  threshold_analysis: {},
  roc_curve: [],
  pr_curve: [],
  calibration_curve: [],
  cohort: {},
  operating_threshold: 0.14,
  known_limitations: [],
};

describe('model artifact loader', () => {
  it('resolves paths under the configured engine directory', () => {
    expect(artifactPath('ml', 'x.json')).toBe(path.join(engineDir, 'ml', 'artifacts', 'x.json'));
  });

  it('reports a missing artifact with the command that generates it', () => {
    const result = loadReadmissionMetrics();
    expect(result.status).toBe('missing');
    if (result.status === 'missing') {
      expect(result.command).toContain('train_readmission_model');
      expect(result.file).toBe('engine/ml/artifacts/readmission_risk_metrics.json');
    }
  });

  it('loads a valid artifact', () => {
    writeArtifact('ml', 'readmission_risk_metrics.json', validMetrics);
    const result = loadReadmissionMetrics();
    expect(result.status).toBe('ok');
    if (result.status === 'ok') expect(result.data.model_version).toBe('v-test');
  });

  it('flags an artifact that is missing required keys instead of rendering partial data', () => {
    writeArtifact('ml', 'readmission_risk_metrics.json', { model_version: 'v-test' });
    const result = loadReadmissionMetrics();
    expect(result.status).toBe('invalid');
    if (result.status === 'invalid') expect(result.reason).toContain('roc_auc');
  });

  it('flags malformed JSON', () => {
    writeArtifact('ml', 'readmission_risk_explanations.json', '{not json');
    expect(loadReadmissionExplanations().status).toBe('invalid');
  });

  it('loads explanations and fairness artifacts independently', () => {
    writeArtifact('ml', 'readmission_risk_explanations.json', {
      model_version: 'v', global_importance: [], score_scale: 'log-odds',
    });
    writeArtifact('ml', 'readmission_risk_fairness.json', { model_version: 'v', attributes: {}, caveat: 'c' });
    expect(loadReadmissionExplanations().status).toBe('ok');
    expect(loadReadmissionFairness().status).toBe('ok');
  });

  it('requireKeys rejects non-objects and arrays', () => {
    expect(requireKeys(null, ['a'])).toBe('Expected a JSON object');
    expect(requireKeys([], ['a'])).toBe('Expected a JSON object');
    expect(requireKeys({ a: 1 }, ['a'])).toBeNull();
    expect(requireKeys({ a: 1 }, ['a', 'b'])).toBe('Missing keys: b');
  });
});

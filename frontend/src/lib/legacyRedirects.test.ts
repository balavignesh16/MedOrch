import { describe, expect, it } from 'vitest';
import { buildLegacyAgentRedirects, LEGACY_AGENT_CONTEXTS } from './legacyRedirects';

describe('buildLegacyAgentRedirects', () => {
  const redirects = buildLegacyAgentRedirects();

  it('redirects every legacy agent path to the unified assistant route', () => {
    for (const redirect of redirects) {
      expect(redirect.source).toMatch(/^\/agents\//);
      expect(redirect.destination).toMatch(/^\/assistant\?context=/);
      expect(redirect.permanent).toBe(false);
    }
  });

  it('covers every legacy agent route that used to exist', () => {
    const sources = redirects.map((redirect) => redirect.source);
    expect(sources).toEqual(
      expect.arrayContaining([
        '/agents/billing',
        '/agents/clinical_triage',
        '/agents/cyber_grc',
        '/agents/patient_navigation',
        '/agents/predictive_analytics',
        '/agents/resource_optimization',
      ]),
    );
  });

  it('maps clinical_triage and resource_optimization to their matching contexts', () => {
    expect(LEGACY_AGENT_CONTEXTS.clinical_triage).toBe('clinical');
    expect(LEGACY_AGENT_CONTEXTS.resource_optimization).toBe('operations');
  });

  it('falls back routes with no direct equivalent to general rather than a fake capability', () => {
    expect(LEGACY_AGENT_CONTEXTS.predictive_analytics).toBe('general');
    expect(LEGACY_AGENT_CONTEXTS.cyber_grc).toBe('general');
    expect(LEGACY_AGENT_CONTEXTS.patient_navigation).toBe('general');
  });
});

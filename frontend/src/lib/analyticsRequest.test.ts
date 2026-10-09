import { describe, expect, it } from 'vitest';
import { ALLOWED_AGENT_TARGETS, MAX_PROMPT_LENGTH, validateAnalyticsRequest } from './analyticsRequest';

describe('validateAnalyticsRequest', () => {
  it('normalizes a valid request', () => {
    expect(validateAnalyticsRequest({ prompt: ' count encounters ', agent_target: 'general' }))
      .toEqual({ ok: true, value: { prompt: 'count encounters', agentTarget: 'general' } });
  });

  it('derives the allowlist from config/assistant_capabilities.json, not a hardcoded duplicate', () => {
    // Regression test: this list used to be hand-maintained separately from
    // the registry and silently desynced when the "predictive" context was
    // added there, causing a real "Unknown agent target" failure in
    // production despite the registry itself being correct.
    expect(ALLOWED_AGENT_TARGETS.has('predictive')).toBe(true);
    expect(validateAnalyticsRequest({ prompt: 'risk by age group', agent_target: 'predictive' }).ok)
      .toBe(true);
  });

  it.each([null, [], 'prompt'])('rejects non-object input', (body) => {
    expect(validateAnalyticsRequest(body).ok).toBe(false);
  });

  it('rejects unknown agents', () => {
    expect(validateAnalyticsRequest({ prompt: 'hello', agent_target: 'root' }))
      .toEqual({ ok: false, error: 'Unknown agent target' });
  });

  it('rejects oversized prompts', () => {
    expect(validateAnalyticsRequest({ prompt: 'x'.repeat(MAX_PROMPT_LENGTH + 1) }).ok)
      .toBe(false);
  });
});


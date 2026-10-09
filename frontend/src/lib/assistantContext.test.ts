import { describe, expect, it } from 'vitest';
import {
  friendlyErrorMessage,
  isContextSelectable,
  resolveInitialContext,
  suggestedPromptsFor,
  unavailabilityReason,
} from './assistantContext';
import type { AssistantCapabilityContext } from './assistantTypes';

const general: AssistantCapabilityContext = {
  id: 'general',
  display_name: 'General Analytics',
  description: 'desc',
  available: true,
  required_tables: ['hospital_readmissions'],
  required_columns: [],
  suggested_prompts: ['How many encounters were readmitted?'],
  unsupported_examples: [],
  safety_limitations: [],
  unavailable_reason: null,
};

const billing: AssistantCapabilityContext = {
  ...general,
  id: 'billing',
  available: false,
  suggested_prompts: [],
  unavailable_reason: 'No billing data exists in the bundled dataset.',
};

describe('resolveInitialContext', () => {
  it('uses the requested context when it exists in the registry', () => {
    expect(resolveInitialContext('billing', [general, billing])).toBe('billing');
  });

  it('falls back to general when the requested context is unknown', () => {
    expect(resolveInitialContext('nonexistent', [general, billing])).toBe('general');
  });

  it('falls back to general when nothing is requested', () => {
    expect(resolveInitialContext(null, [general, billing])).toBe('general');
  });
});

describe('isContextSelectable', () => {
  it('is true only for available contexts', () => {
    expect(isContextSelectable(general)).toBe(true);
    expect(isContextSelectable(billing)).toBe(false);
    expect(isContextSelectable(undefined)).toBe(false);
  });
});

describe('suggestedPromptsFor', () => {
  it('returns prompts for available contexts', () => {
    expect(suggestedPromptsFor(general)).toEqual(['How many encounters were readmitted?']);
  });

  it('returns no prompts for unavailable contexts, even if the registry declares some', () => {
    const withPrompts: AssistantCapabilityContext = { ...billing, suggested_prompts: ['should not appear'] };
    expect(suggestedPromptsFor(withPrompts)).toEqual([]);
  });
});

describe('unavailabilityReason', () => {
  it('surfaces the registry reason', () => {
    expect(unavailabilityReason(billing)).toBe('No billing data exists in the bundled dataset.');
  });

  it('has a safe fallback for an unknown context', () => {
    expect(unavailabilityReason(undefined)).toBe('Unknown analytics context.');
  });
});

describe('friendlyErrorMessage', () => {
  it('gives specific, actionable guidance for known error codes', () => {
    expect(friendlyErrorMessage('INVALID_MODEL_OUTPUT', 'fallback')).toContain('rephrasing');
    expect(friendlyErrorMessage('MODEL_TIMEOUT', 'fallback')).toContain('took too long');
    expect(friendlyErrorMessage('UNSAFE_SQL', 'fallback')).toContain('safety checks');
  });

  it('never leaks server internals; falls back to the safe server message for unknown codes', () => {
    expect(friendlyErrorMessage('SOME_NEW_CODE', 'a safe server message')).toBe('a safe server message');
  });

  it('does not contain stack-trace or exception-shaped text for any known code', () => {
    const codes = [
      'UNKNOWN_CONTEXT', 'CONTEXT_UNAVAILABLE', 'UNSUPPORTED_REQUEST', 'INVALID_MODEL_OUTPUT',
      'UNSAFE_SQL', 'QUERY_TIMEOUT', 'MODEL_TIMEOUT', 'MODEL_UNAVAILABLE', 'MODEL_SERVICE_ERROR',
      'GROUNDING_FAILED', 'IDENTIFIER_EXPOSURE', 'AUDIT_FAILURE',
    ];
    for (const code of codes) {
      const message = friendlyErrorMessage(code, 'fallback');
      expect(message).not.toMatch(/Traceback|Exception|at engine\.|File "/);
    }
  });
});

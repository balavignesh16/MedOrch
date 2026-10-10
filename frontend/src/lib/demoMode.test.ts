import { describe, expect, it } from 'vitest';
import { isDemoModeEnabled } from './demoMode';

describe('isDemoModeEnabled', () => {
  it('is off by default and for anything other than an explicit true', () => {
    expect(isDemoModeEnabled(undefined)).toBe(false);
    expect(isDemoModeEnabled('')).toBe(false);
    expect(isDemoModeEnabled('false')).toBe(false);
    expect(isDemoModeEnabled('1')).toBe(false);
    expect(isDemoModeEnabled('yes')).toBe(false);
  });

  it('is on only for "true", ignoring case and surrounding whitespace', () => {
    expect(isDemoModeEnabled('true')).toBe(true);
    expect(isDemoModeEnabled(' TRUE ')).toBe(true);
  });
});

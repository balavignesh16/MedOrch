import { describe, expect, it } from 'vitest';
import { parsePatientId } from './patientId';

describe('parsePatientId', () => {
  it('accepts positive integer IDs', () => {
    expect(parsePatientId('42')).toBe(42);
  });

  it.each(['', '0', '-1', '1.5', 'abc', '12abc'])('rejects invalid ID %s', (value) => {
    expect(parsePatientId(value)).toBeNull();
  });
});


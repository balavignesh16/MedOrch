import { describe, expect, it } from 'vitest';
import { labelFor, parseIdMappings } from './idMappings';

const SAMPLE = [
  'admission_type_id,description',
  '1,Emergency',
  '2,Urgent',
  '',
  'discharge_disposition_id,description',
  '1,Discharged to home',
  '19,"Expired at home. Medicaid only, hospice."',
  '',
  'admission_source_id,description',
  '7,Emergency Room',
].join('\r\n');

describe('parseIdMappings', () => {
  it('parses stacked tables separated by blank lines, including CRLF input', () => {
    const mappings = parseIdMappings(SAMPLE);
    expect(Object.keys(mappings).sort()).toEqual(['admission_source_id', 'admission_type_id', 'discharge_disposition_id']);
    expect(mappings.admission_type_id).toEqual({ 1: 'Emergency', 2: 'Urgent' });
    expect(mappings.admission_source_id[7]).toBe('Emergency Room');
  });

  it('keeps commas inside quoted descriptions', () => {
    expect(parseIdMappings(SAMPLE).discharge_disposition_id[19]).toBe('Expired at home. Medicaid only, hospice.');
  });

  it('ignores junk lines and returns an empty mapping for empty input', () => {
    expect(parseIdMappings('')).toEqual({});
    expect(parseIdMappings('not,a,table\n1,orphan')).toEqual({});
  });
});

describe('labelFor', () => {
  const mappings = parseIdMappings(SAMPLE);
  it('returns the label, or the raw code when unknown so nothing is hidden', () => {
    expect(labelFor(mappings, 'admission_type_id', 1)).toBe('Emergency');
    expect(labelFor(mappings, 'admission_type_id', '2')).toBe('Urgent');
    expect(labelFor(mappings, 'admission_type_id', 99)).toBe('Code 99');
    expect(labelFor(mappings, 'unknown_column', 1)).toBe('Code 1');
    expect(labelFor(mappings, 'admission_type_id', null)).toBe('Unknown');
  });
});

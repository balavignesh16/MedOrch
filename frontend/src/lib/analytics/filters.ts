import { AnalyticsFilterState } from './types';

const TEXT_FILTER_KEYS = [
  'gender',
  'age',
  'race',
  'admission_type_id',
  'discharge_disposition_id',
  'diag_1',
] as const satisfies readonly (keyof AnalyticsFilterState)[];

export const ENUM_FILTER_VALUES = {
  readmitted: ['<30', '>30', 'NO'],
  riskLevel: ['Critical', 'High', 'Medium', 'Low'],
  los: ['0-3', '4-7', '8+'],
  medCount: ['0-10', '11-20', '20+'],
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeFilters(filters: unknown): AnalyticsFilterState {
  if (!isRecord(filters)) return {};
  const normalized: AnalyticsFilterState = {};

  for (const key of TEXT_FILTER_KEYS) {
    const value = filters[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      normalized[key] = String(value).trim();
    }
  }

  for (const key of Object.keys(ENUM_FILTER_VALUES) as (keyof typeof ENUM_FILTER_VALUES)[]) {
    const value = String(filters[key] ?? '').trim();
    if ((ENUM_FILTER_VALUES[key] as readonly string[]).includes(value)) {
      normalized[key] = value;
    }
  }
  
  return normalized;
}

export function hasActiveFilters(filters: AnalyticsFilterState): boolean {
  return Object.values(filters).some(val => val !== undefined && val !== '');
}

export function isSupportedEnumFilter(
  key: keyof typeof ENUM_FILTER_VALUES,
  value: string | undefined,
): boolean {
  return value !== undefined && (ENUM_FILTER_VALUES[key] as readonly string[]).includes(value);
}

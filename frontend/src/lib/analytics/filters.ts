import { AnalyticsFilterState } from './types';

export function normalizeFilters(filters: any): AnalyticsFilterState {
  if (!filters) return {};
  const normalized: AnalyticsFilterState = {};
  
  if (filters.gender) normalized.gender = String(filters.gender);
  if (filters.age) normalized.age = String(filters.age);
  if (filters.race) normalized.race = String(filters.race);
  if (filters.admission_type_id) normalized.admission_type_id = String(filters.admission_type_id);
  if (filters.discharge_disposition_id) normalized.discharge_disposition_id = String(filters.discharge_disposition_id);
  if (filters.readmitted) normalized.readmitted = String(filters.readmitted);
  if (filters.diag_1) normalized.diag_1 = String(filters.diag_1);
  if (filters.riskLevel) normalized.riskLevel = String(filters.riskLevel);
  if (filters.los) normalized.los = String(filters.los);
  if (filters.medCount) normalized.medCount = String(filters.medCount);
  
  return normalized;
}

export function hasActiveFilters(filters: AnalyticsFilterState): boolean {
  return Object.values(filters).some(val => val !== undefined && val !== null && val !== '');
}

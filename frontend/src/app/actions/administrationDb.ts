"use server";

import { fetchAdministrativeOverview, fetchDepartmentScorecards, fetchStaffingIntelligence, fetchCapacityAllocation, fetchComplianceDashboard, fetchAdministrativeGovernance, fetchAdministrativeTrends, fetchAdministrativeInsights, AdministrativeFilterState } from '@/lib/administrationLogic';

export async function getAdministrativeOverview(filters: AdministrativeFilterState) {
  return fetchAdministrativeOverview(filters);
}

export async function getDepartmentScorecards(filters: AdministrativeFilterState) {
  return fetchDepartmentScorecards(filters);
}

export async function getStaffingIntelligence(filters: AdministrativeFilterState) {
  return fetchStaffingIntelligence(filters);
}

export async function getCapacityAllocation(filters: AdministrativeFilterState) {
  return fetchCapacityAllocation(filters);
}

export async function getComplianceDashboard(filters: AdministrativeFilterState) {
  return fetchComplianceDashboard(filters);
}

export async function getAdministrativeGovernance(filters: AdministrativeFilterState) {
  return fetchAdministrativeGovernance(filters);
}

export async function getAdministrativeTrends(filters: AdministrativeFilterState) {
  return fetchAdministrativeTrends(filters);
}

export async function getAdministrativeInsights(filters: AdministrativeFilterState) {
  return fetchAdministrativeInsights(filters);
}

'use server';

import {
  fetchGlobalSearch,
  fetchNotifications,
  fetchSavedWorkspaces,
  fetchReports,
  fetchTimeline,
  fetchAuditLogs,
  fetchEnterpriseSettings,
  fetchUserPermissions,
  fetchSystemHealth,
  fetchDocumentationDirectory,
  fetchExportHistory
} from '@/lib/platformLogic';

export async function getGlobalSearch(query: string) {
  return fetchGlobalSearch(query);
}

export async function getPlatformNotifications() {
  return fetchNotifications();
}

export async function getPlatformWorkspaces() {
  return fetchSavedWorkspaces();
}

export async function getPlatformReports() {
  return fetchReports();
}

export async function getPlatformTimeline() {
  return fetchTimeline();
}

export async function getPlatformAuditLogs() {
  return fetchAuditLogs();
}

export async function getPlatformSettings() {
  return fetchEnterpriseSettings();
}

export async function getPlatformPermissions(role: string) {
  return fetchUserPermissions(role);
}

export async function getPlatformSystemHealth() {
  return fetchSystemHealth();
}

export async function getPlatformDocumentation() {
  return fetchDocumentationDirectory();
}

export async function getPlatformExportHistory() {
  return fetchExportHistory();
}

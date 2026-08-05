import { cache } from 'react';
import { performGlobalSearch } from './platform/searchEngine';
import { getNotifications } from './platform/notificationEngine';
import { getSavedWorkspaces } from './platform/workspaceEngine';
import { getSavedReports } from './platform/reportEngine';
import { getTimelineEvents } from './platform/timelineEngine';
import { getAuditLogs } from './platform/auditEngine';
import { getEnterpriseSettings } from './platform/settingsEngine';
import { getUserPermissions } from './platform/permissionEngine';
import { getSystemHealth } from './platform/systemHealthEngine';
import { getDocumentation } from './platform/documentationEngine';
import { getExportHistory } from './platform/exportEngine';

export const fetchGlobalSearch = cache(async (query: string) => {
  return performGlobalSearch(query);
});

export const fetchNotifications = cache(async () => {
  return getNotifications();
});

export const fetchSavedWorkspaces = cache(async () => {
  return getSavedWorkspaces();
});

export const fetchReports = cache(async () => {
  return getSavedReports();
});

export const fetchTimeline = cache(async () => {
  return getTimelineEvents();
});

export const fetchAuditLogs = cache(async () => {
  return getAuditLogs();
});

export const fetchEnterpriseSettings = cache(async () => {
  return getEnterpriseSettings();
});

export const fetchUserPermissions = cache(async (role: string) => {
  return getUserPermissions(role);
});

export const fetchSystemHealth = cache(async () => {
  return getSystemHealth();
});

export const fetchDocumentationDirectory = cache(async () => {
  return getDocumentation();
});

export const fetchExportHistory = cache(async () => {
  return getExportHistory();
});

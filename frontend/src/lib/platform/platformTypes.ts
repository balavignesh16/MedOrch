export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  level: 'Critical' | 'Warning' | 'Info' | 'Resolved';
  module: string;
  timestamp: string;
  read: boolean;
}

export interface PlatformSearchResult {
  id: string;
  type: 'Patient' | 'Dashboard' | 'KPI' | 'Department' | 'Insight' | 'Prediction' | 'Report';
  title: string;
  subtitle?: string;
  module: string;
  url: string;
}

export interface WorkspaceView {
  id: string;
  name: string;
  description?: string;
  type: 'Dashboard' | 'Filter' | 'Report' | 'Chart';
  lastModified: string;
}

export interface TimelineEvent {
  id: string;
  module: string;
  action: string;
  actor: string;
  timestamp: string;
  details: string;
}

export interface SystemHealthMetric {
  service: string;
  status: 'Operational' | 'Degraded' | 'Outage';
  latency: string;
  uptime: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  module: string;
  timestamp: string;
  ip: string;
}

export interface DocumentationItem {
  id: string;
  title: string;
  category: 'Architecture' | 'Sprint Report' | 'Governance' | 'Guide';
  lastUpdated: string;
}

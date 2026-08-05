export type RefreshPolicy = 'realtime' | 'on-load' | 'daily' | 'hourly';
export type WidgetStatus = 'active' | 'deprecated' | 'beta' | 'planned';
export type Visibility = 'public' | 'private' | 'restricted';

export interface WidgetRegistryEntry {
  id: string; // Hierarchical e.g., exec.kpi.readmission_rate
  name: string;
  purpose: string;
  businessOwner: string;
  dataSource: string;
  dependencies: string[];
  refreshPolicy: RefreshPolicy;
  permissions: string[];
  status: WidgetStatus;
  version: string;
  category: string;
  featureFlag?: string;
  route?: string;
  visibility: Visibility;
}

// Enterprise Widget Registry
export const WIDGET_REGISTRY: Record<string, WidgetRegistryEntry> = {
  'exec.kpi.hospital_health': {
    id: 'exec.kpi.hospital_health',
    name: 'Hospital Health Score',
    purpose: 'Provide a single, at-a-glance health metric for the hospital.',
    businessOwner: 'Chief Medical Officer',
    dataSource: 'medorch.db -> hospital_readmissions',
    dependencies: ['getHospitalHealthScore'],
    refreshPolicy: 'on-load',
    permissions: ['executive:read'],
    status: 'planned',
    version: '1.0.0',
    category: 'KPI',
    featureFlag: 'enable-hospital-health-kpi',
    route: '/executive/health',
    visibility: 'restricted',
  },
  'exec.kpi.readmission_rate': {
    id: 'exec.kpi.readmission_rate',
    name: 'Readmission Rate',
    purpose: 'Display trailing 30-day readmission percentage.',
    businessOwner: 'VP of Clinical Quality',
    dataSource: 'medorch.db -> hospital_readmissions',
    dependencies: ['getKpiMetrics'],
    refreshPolicy: 'on-load',
    permissions: ['clinical:read'],
    status: 'planned',
    version: '1.0.0',
    category: 'KPI',
    featureFlag: 'enable-readmission-kpi',
    route: '/executive/quality/readmissions',
    visibility: 'restricted',
  },
  'exec.chart.population_age': {
    id: 'exec.chart.population_age',
    name: 'Admissions by Age Group',
    purpose: 'Show demographic distribution of patient cohort.',
    businessOwner: 'Director of Population Health',
    dataSource: 'medorch.db -> hospital_readmissions',
    dependencies: ['getTrendMetrics'],
    refreshPolicy: 'on-load',
    permissions: ['clinical:read'],
    status: 'planned',
    version: '1.0.0',
    category: 'Chart',
    visibility: 'public',
  },
  'exec.alert.readmission': {
    id: 'exec.alert.readmission',
    name: 'Readmission Alerts',
    purpose: 'Surface critical threshold breaches for readmission rates.',
    businessOwner: 'Operations Manager',
    dataSource: 'medorch.db -> hospital_readmissions',
    dependencies: ['getOperationalAlerts'],
    refreshPolicy: 'realtime',
    permissions: ['ops:read'],
    status: 'planned',
    version: '1.0.0',
    category: 'Alert',
    visibility: 'restricted',
  }
};

export function getWidgetMetadata(widgetId: string): WidgetRegistryEntry | undefined {
  return WIDGET_REGISTRY[widgetId];
}

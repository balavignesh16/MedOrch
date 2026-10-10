export interface PlatformSearchResult {
  id: string;
  type: 'Patient' | 'Dashboard' | 'KPI' | 'Department' | 'Insight' | 'Prediction' | 'Report';
  title: string;
  subtitle?: string;
  module: string;
  url: string;
}

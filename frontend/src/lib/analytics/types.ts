export interface AnalyticsFilterState {
  gender?: string;
  age?: string;
  race?: string;
  admission_type_id?: string;
  discharge_disposition_id?: string;
  readmitted?: string;
  time_period?: string;
  timeframe?: string;
  cohort?: string;
  department?: string;
  facility?: string;
  diag_1?: string;
  riskLevel?: string;
  los?: string;
  medCount?: string;
}

export interface AnalyticsQuery {
  whereClause: string;
  params: SqlValue[];
  conditionsCount: number;
}

export type SqlValue = string | number | bigint | Buffer | null;

export type UnknownRecord = Record<string, unknown>;

export interface AggregationResult {
  count: number;
  avg_time?: number;
  avg_meds?: number;
  avg_er?: number;
  avg_proc?: number;
}

export interface CoreMetricResult {
  totalEncounters: number;
  readmissionNumerator: number;
  readmissionDenominator: number;
  readmissionProxyRate: number;
  avgLengthOfStay: number | null;
}

export interface Insight {
  title: string;
  severity: 'Positive' | 'Warning' | 'Critical' | 'Info' | string;
  confidence: number;
  supportingMetric: string;
  clinicalImpact?: string;
  businessImpact?: string;
  operationalImpact?: string;
  rootCause?: string;
  recommendedAction: string;
  affectedPopulation?: string;
  affectedPatients?: number;
  relatedDashboard: string;
  timestamp?: string;
  text?: string;
  type?: 'Positive' | 'Warning' | 'Critical' | 'Info';
}

export type RiskCategory = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Benchmark {
  metric: string;
  target: number;
  nationalAvg: number;
  tolerance: number;
}

export interface TrendData {
  name: string;
  [key: string]: string | number;
}

export interface WidgetData {
  title: string;
  value: number | string;
  status: 'Excellent' | 'Good' | 'Watch' | 'Critical' | string;
}

export interface KPI {
  title: string;
  value: number;
  target: number;
  variance: number;
  status: string;
}

export interface Score {
  value: number;
  breakdown: Record<string, number>;
  grade?: string;
}

export type KpiStatus = 'Excellent' | 'Good' | 'Watch' | 'Critical';

export type SummaryInsight = {
  type: 'Positive' | 'Warning' | 'Critical' | 'Info';
  text: string;
};

export type FilterState = AnalyticsFilterState;

export interface StrategicInsight {
  title: string;
  priority: 'Immediate' | 'Short Term' | 'Mid Term' | 'Long Term' | string;
  supportingKpi: string;
  expectedImpact: string;
  recommendedAction: string;
  timeframe: string;
  confidence: number;
  relatedModule: string;
}

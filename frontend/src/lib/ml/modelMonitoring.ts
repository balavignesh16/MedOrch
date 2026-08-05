import { getModelMetadata, ModelMetadata } from './modelRegistry';

export interface MonitoringSummary {
  modelName: string;
  modelVersion: string;
  modelStatus: string;
  healthStatus: 'Healthy' | 'Degraded' | 'Failing';
  totalPredictions: number;
  averageConfidence: number;
  confidenceDistribution: { high: number; medium: number; low: number };
  lastPredictionTimestamp: string | null;
  lastModelRefresh: string;
  driftStatus: 'None' | 'Detected' | 'Warning';
  retrainingStatus: 'Not Required' | 'Recommended' | 'In Progress';
  monitoringStatus: 'Active' | 'Paused';
}

class ModelMonitor {
  private stats: Record<string, {
    totalPredictions: number;
    confidenceSum: number;
    confidenceDistribution: { high: number; medium: number; low: number };
    lastPredictionTime: string | null;
  }> = {};

  constructor() {
    // Initialize with some dummy stats
    this.stats['readmission_v1'] = {
      totalPredictions: 1420,
      confidenceSum: 1420 * 88.5,
      confidenceDistribution: { high: 850, medium: 420, low: 150 },
      lastPredictionTime: new Date().toISOString()
    };
  }

  public recordPrediction(modelId: string, confidence: number) {
    if (!this.stats[modelId]) {
      this.stats[modelId] = {
        totalPredictions: 0,
        confidenceSum: 0,
        confidenceDistribution: { high: 0, medium: 0, low: 0 },
        lastPredictionTime: null
      };
    }
    
    const s = this.stats[modelId];
    s.totalPredictions += 1;
    s.confidenceSum += confidence;
    s.lastPredictionTime = new Date().toISOString();
    
    if (confidence >= 85) s.confidenceDistribution.high += 1;
    else if (confidence >= 70) s.confidenceDistribution.medium += 1;
    else s.confidenceDistribution.low += 1;
  }

  public getMonitoringSummary(modelId: string): MonitoringSummary {
    const meta = getModelMetadata(modelId);
    const s = this.stats[modelId] || {
      totalPredictions: 0, confidenceSum: 0, confidenceDistribution: { high: 0, medium: 0, low: 0 }, lastPredictionTime: null
    };
    
    const avgConf = s.totalPredictions > 0 ? s.confidenceSum / s.totalPredictions : 0;
    
    return {
      modelName: meta?.name || 'Unknown Model',
      modelVersion: meta?.version || '0.0.0',
      modelStatus: meta?.status || 'Unknown',
      healthStatus: avgConf >= 80 ? 'Healthy' : avgConf >= 60 ? 'Degraded' : 'Failing',
      totalPredictions: s.totalPredictions,
      averageConfidence: Number(avgConf.toFixed(1)),
      confidenceDistribution: s.confidenceDistribution,
      lastPredictionTimestamp: s.lastPredictionTime,
      lastModelRefresh: meta?.lastUpdated || 'Unknown',
      driftStatus: 'None',
      retrainingStatus: 'Not Required',
      monitoringStatus: 'Active'
    };
  }
}

export const modelMonitor = new ModelMonitor();

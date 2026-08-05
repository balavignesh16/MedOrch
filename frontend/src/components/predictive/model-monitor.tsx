import React from 'react';
import { MonitoringSummary } from '@/lib/ml/modelMonitoring';
import { ShieldCheck } from 'lucide-react';

interface ModelMonitorProps {
  summary: MonitoringSummary;
}

export const ModelMonitor: React.FC<ModelMonitorProps> = ({ summary }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:border-brand-cyan/50 transition-colors duration-500">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-success via-brand-teal to-brand-cyan opacity-80"></div>
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-base font-semibold text-white flex items-center">
          <ShieldCheck className="text-brand-cyan w-5 h-5 mr-2" />
          Enterprise Model Monitor
        </h3>
        <div className={`text-xs px-3 py-1 rounded-full border ${
          summary.healthStatus === 'Healthy' ? 'bg-brand-success/10 border-brand-success/30 text-brand-success shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
          summary.healthStatus === 'Degraded' ? 'bg-brand-warning/10 border-brand-warning/30 text-brand-warning shadow-[0_0_10px_rgba(245,158,11,0.2)]' :
          'bg-brand-error/10 border-brand-error/30 text-brand-error shadow-[0_0_10px_rgba(239,68,68,0.2)]'
        }`}>
          {summary.healthStatus}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-brand-gray mb-1">Total Predictions</p>
          <p className="text-xl text-white font-mono font-semibold">{summary.totalPredictions.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-brand-gray mb-1">Avg Confidence</p>
          <p className="text-xl text-brand-cyan font-mono font-semibold">{summary.averageConfidence}%</p>
        </div>
      </div>

      <h4 className="text-[11px] uppercase tracking-wider font-semibold text-white/70 mb-3">Confidence Distribution</h4>
      <div className="h-2.5 rounded-full flex overflow-hidden mb-3 shadow-inner bg-slate-900">
        <div 
          className="bg-gradient-to-r from-brand-success/80 to-brand-success h-full transition-all duration-1000"
          style={{ width: `${(summary.confidenceDistribution.high / summary.totalPredictions) * 100 || 0}%` }}
        />
        <div 
          className="bg-gradient-to-r from-brand-warning/80 to-brand-warning h-full transition-all duration-1000"
          style={{ width: `${(summary.confidenceDistribution.medium / summary.totalPredictions) * 100 || 0}%` }}
        />
        <div 
          className="bg-gradient-to-r from-brand-error/80 to-brand-error h-full transition-all duration-1000"
          style={{ width: `${(summary.confidenceDistribution.low / summary.totalPredictions) * 100 || 0}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-medium text-brand-gray mb-8">
        <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-brand-success mr-1"></div>High ({summary.confidenceDistribution.high})</span>
        <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-brand-warning mr-1"></div>Med ({summary.confidenceDistribution.medium})</span>
        <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-brand-error mr-1"></div>Low ({summary.confidenceDistribution.low})</span>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-brand-gray text-xs">Drift Detection</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            summary.driftStatus === 'None' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-warning/10 text-brand-warning'
          }`}>{summary.driftStatus}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-brand-gray text-xs">Retraining Required</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            summary.retrainingStatus === 'Not Required' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-warning/10 text-brand-warning'
          }`}>{summary.retrainingStatus}</span>
        </div>
        <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-4">
          <span className="text-brand-gray text-xs">Last Prediction</span>
          <span className="text-white text-xs font-mono">
            {summary.lastPredictionTimestamp ? new Date(summary.lastPredictionTimestamp).toLocaleTimeString() : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

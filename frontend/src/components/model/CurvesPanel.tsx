'use client';

import React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ReadmissionMetrics } from '@/lib/ml/modelArtifactTypes';
import { buildCalibrationSeries, buildPrSeries, buildRocSeries } from '@/lib/ml/modelArtifactViews';
import { CHART_TOOLTIP_STYLE, Panel } from './Panel';

const AXIS = { stroke: 'rgba(255,255,255,0.4)', fontSize: 11, tickLine: false } as const;

function ChartFrame({ children }: { children: React.ReactElement }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function CurvesPanel({ metrics }: { metrics: ReadmissionMetrics }) {
  const roc = buildRocSeries(metrics);
  const pr = buildPrSeries(metrics);
  const calibration = buildCalibrationSeries(metrics);
  const diagonal = [
    { fpr: 0, y: 0 },
    { fpr: 1, y: 1 },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Panel title="ROC curve" subtitle="True-positive rate against false-positive rate on the held-out test set.">
        <ChartFrame>
          <LineChart margin={{ top: 5, right: 15, left: 0, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" dataKey="fpr" domain={[0, 1]} {...AXIS} label={{ value: 'False-positive rate', position: 'insideBottom', offset: -8, fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
            <YAxis type="number" domain={[0, 1]} {...AXIS} />
            <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value) => Number(value).toFixed(3)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line data={diagonal} dataKey="y" name="No skill" stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            <Line data={roc} dataKey="tpr" name="Model" stroke="#14b8a6" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ChartFrame>
      </Panel>

      <Panel title="Precision-recall curve" subtitle="Dashed line = prevalence, the precision of flagging everyone.">
        <ChartFrame>
          <LineChart data={pr} margin={{ top: 5, right: 15, left: 0, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" dataKey="recall" domain={[0, 1]} {...AXIS} label={{ value: 'Recall', position: 'insideBottom', offset: -8, fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
            <YAxis type="number" domain={[0, 1]} {...AXIS} />
            <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value) => Number(value).toFixed(3)} />
            <ReferenceLine y={metrics.prevalence} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 4" />
            <Line dataKey="precision" name="Precision" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ChartFrame>
      </Panel>

      <Panel title="Calibration" subtitle="Predicted vs. observed risk in 10 equal-size bins. On the diagonal = trustworthy probabilities.">
        <ChartFrame>
          <LineChart data={calibration} margin={{ top: 5, right: 15, left: 0, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" dataKey="predicted" domain={[0, 'auto']} {...AXIS} label={{ value: 'Mean predicted risk', position: 'insideBottom', offset: -8, fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
            <YAxis type="number" domain={[0, 'auto']} {...AXIS} />
            <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value) => Number(value).toFixed(3)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line data={[{ predicted: 0, perfect: 0 }, { predicted: Math.max(...calibration.map((b) => b.predicted), 0.01), perfect: Math.max(...calibration.map((b) => b.predicted), 0.01) }]} dataKey="perfect" name="Perfect" stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            <Line dataKey="observed" name="Observed rate" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          </LineChart>
        </ChartFrame>
      </Panel>
    </div>
  );
}

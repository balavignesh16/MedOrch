'use client';

import React from 'react';
import { AskAboutButton } from '@/components/model/AskAboutButton';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RiskSummary } from '@/lib/ml/predictiveData';
import { formatCount, formatPercent } from '@/lib/ml/modelArtifactViews';
import { CHART_TOOLTIP_STYLE, Panel } from './Panel';

interface RiskDistributionProps {
  summary: RiskSummary;
  operatingThreshold?: number;
  topDecileThreshold?: number;
}

export function RiskDistribution({ summary, operatingThreshold, topDecileThreshold }: RiskDistributionProps) {
  const data = summary.bins.map((bin) => ({
    label: `${Math.round(bin.from * 100)}–${Math.round(bin.to * 100)}%`,
    from: bin.from,
    count: bin.count,
  }));
  const bucketFor = (threshold: number | undefined) =>
    threshold === undefined ? undefined : data.find((d) => threshold >= d.from && threshold < d.from + 0.05)?.label;

  return (
    <Panel
      title="Distribution of predicted risk"
      aside={<AskAboutButton prompt="What is the average predicted readmission risk by age bracket for encounters where predicted_readmission_risk_in_scope = 1?" />}
      subtitle={`${formatCount(summary.scoredEncounters)} scored in-scope encounters. Mean predicted risk ${formatPercent(
        summary.meanPredictedRisk,
      )} vs. observed 30-day readmission rate ${formatPercent(summary.observedWithin30DayRate)} (scores include rows the model trained on).`}
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} interval={1} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
            <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value) => [formatCount(Number(value)), 'Encounters']} />
            {bucketFor(operatingThreshold) && (
              <ReferenceLine x={bucketFor(operatingThreshold)} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'operating', fill: '#f97316', fontSize: 10, position: 'top' }} />
            )}
            {bucketFor(topDecileThreshold) && (
              <ReferenceLine x={bucketFor(topDecileThreshold)} stroke="#06b6d4" strokeDasharray="4 4" label={{ value: 'top 10%', fill: '#06b6d4', fontSize: 10, position: 'insideTopRight' }} />
            )}
            <Bar dataKey="count" fill="#14b8a6" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

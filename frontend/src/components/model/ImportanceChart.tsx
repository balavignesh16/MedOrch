'use client';

import React from 'react';
import { AskAboutButton } from '@/components/model/AskAboutButton';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ReadmissionExplanations } from '@/lib/ml/modelArtifactTypes';
import { topImportance } from '@/lib/ml/modelArtifactViews';
import { CHART_TOOLTIP_STYLE, Panel } from './Panel';

export function ImportanceChart({ explanations }: { explanations: ReadmissionExplanations }) {
  const bars = topImportance(explanations, 15);
  const colorFor = (raisesRisk: boolean | null) =>
    raisesRisk === true ? '#f97316' : raisesRisk === false ? '#06b6d4' : '#14b8a6';

  return (
    <Panel
      title="What drives the model's predictions (SHAP)"
      aside={<AskAboutButton prompt="What is the average predicted readmission risk by number of prior inpatient visits (number_inpatient) for encounters where predicted_readmission_risk_in_scope = 1?" />}
      subtitle={`Mean absolute SHAP contribution per original feature, on ${explanations.global_sample.rows.toLocaleString(
        'en-US',
      )} held-out encounters. ${explanations.score_scale}`}
    >
      <div className="h-[460px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
            <YAxis type="category" dataKey="label" width={170} stroke="rgba(255,255,255,0.6)" fontSize={11} tickLine={false} />
            <Tooltip
              {...CHART_TOOLTIP_STYLE}
              formatter={(value) => [Number(value).toFixed(4), 'Mean |SHAP|']}
              labelFormatter={(label, payload) => {
                const summary = (payload?.[0]?.payload as { summary?: string } | undefined)?.summary;
                return summary ? `${label} — ${summary}` : String(label);
              }}
            />
            <Bar dataKey="importance" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {bars.map((bar) => (
                <Cell key={bar.feature} fill={colorFor(bar.raisesRisk)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-white/50 mt-2">
        <span className="inline-block w-2 h-2 rounded-sm bg-[#f97316] mr-1" />
        higher values raise risk&nbsp;&nbsp;
        <span className="inline-block w-2 h-2 rounded-sm bg-[#06b6d4] mr-1" />
        higher values lower risk&nbsp;&nbsp;
        <span className="inline-block w-2 h-2 rounded-sm bg-[#14b8a6] mr-1" />
        categorical (hover for which values matter). Importance describes the model, not causes.
      </p>
    </Panel>
  );
}

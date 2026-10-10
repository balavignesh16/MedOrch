'use client';

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartSpec } from '@/lib/assistantChart';

const AXIS = { stroke: 'rgba(255,255,255,0.45)', fontSize: 11, tickLine: false } as const;
const TOOLTIP = {
  contentStyle: { backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' },
  itemStyle: { color: '#fff', fontSize: 12 },
  labelStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
} as const;

export function AssistantChart({ spec }: { spec: ChartSpec }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
        {spec.type === 'bar' ? `${spec.valueLabel} by ${spec.categoryLabel}` : `${spec.yLabel} vs. ${spec.xLabel}`}
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {spec.type === 'bar' ? (
            <BarChart data={spec.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="category" {...AXIS} interval={0} />
              <YAxis {...AXIS} />
              <Tooltip {...TOOLTIP} formatter={(value) => [Number(value).toLocaleString('en-US'), spec.valueLabel]} />
              <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          ) : (
            <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" dataKey="x" name={spec.xLabel} {...AXIS} label={{ value: spec.xLabel, position: 'insideBottom', offset: -8, fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name={spec.yLabel} {...AXIS} />
              <Tooltip {...TOOLTIP} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={spec.data} fill="#06b6d4" isAnimationActive={false} />
            </ScatterChart>
          )}
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-white/40 mt-2">Chart type chosen from the shape of the verified query result, not by the model.</p>
    </div>
  );
}

"use client";

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const data = [
  { subject: 'HIPAA Auth', A: 98, fullMark: 100 },
  { subject: 'Data Encryption', A: 100, fullMark: 100 },
  { subject: 'Access Control', A: 85, fullMark: 100 },
  { subject: 'Audit Logging', A: 95, fullMark: 100 },
  { subject: 'PII Masking', A: 90, fullMark: 100 },
  { subject: 'Anomaly Detect', A: 82, fullMark: 100 },
];

export default function ComplianceRadar() {
  return (
    <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-2xl p-6 h-full shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Security Compliance Posture</h3>
        <p className="text-sm text-slate-400">Real-time GRC agent security score</p>
      </div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Compliance Score"
              dataKey="A"
              stroke="#0d9488"
              fill="#0d9488"
              fillOpacity={0.4}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              itemStyle={{ color: '#2dd4bf' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

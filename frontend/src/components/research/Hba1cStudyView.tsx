'use client';

import React from 'react';
import { AskAboutButton } from '@/components/model/AskAboutButton';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Hba1cStudy } from '@/lib/ml/studyArtifactTypes';
import { consortBoxes, forestRows, formatPValue, rateBars, shortExposureLabel, stratifiedMatrix } from '@/lib/ml/studyViews';
import { formatCount, formatPercent } from '@/lib/ml/modelArtifactViews';
import { CHART_TOOLTIP_STYLE, Panel } from '@/components/model/Panel';

interface BarShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: { ratePercent: number; lowPercent: number; highPercent: number };
}

/** Draws the bar plus its 95% interval; pixel scale is recovered from the bar's own height. */
function BarWithInterval(props: unknown) {
  const { x, y, width, height, payload } = props as BarShapeProps;
  const pixelsPerPercent = payload.ratePercent > 0 ? height / payload.ratePercent : 0;
  const centre = x + width / 2;
  const top = y - (payload.highPercent - payload.ratePercent) * pixelsPerPercent;
  const bottom = y + (payload.ratePercent - payload.lowPercent) * pixelsPerPercent;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} fill="#0f766e" />
      <g stroke="#f8fafc" strokeWidth={2.5} strokeLinecap="round">
        <line x1={centre} x2={centre} y1={top} y2={bottom} />
        <line x1={centre - 7} x2={centre + 7} y1={top} y2={top} />
        <line x1={centre - 7} x2={centre + 7} y1={bottom} y2={bottom} />
      </g>
    </g>
  );
}

function ForestPlot({ study }: { study: Hba1cStudy }) {
  const rows = forestRows(study);
  const values = rows.flatMap((r) => [r.low, r.high]);
  const min = Math.min(0.5, ...values) * 0.95;
  const max = Math.max(1.5, ...values) * 1.05;
  const width = 560;
  const left = 200;
  const rowHeight = 56;
  const height = rows.length * rowHeight + 50;
  const x = (value: number) => left + ((Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min))) * (width - left - 30);
  const ticks = [0.5, 0.75, 1, 1.25, 1.5, 2].filter((t) => t >= min && t <= max);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Forest plot of adjusted odds ratios">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={10} y2={height - 30} stroke="rgba(255,255,255,0.07)" />
          <text x={x(t)} y={height - 12} textAnchor="middle" fontSize={12} fill="rgba(255,255,255,0.5)">{t}</text>
        </g>
      ))}
      <line x1={x(1)} x2={x(1)} y1={10} y2={height - 30} stroke="rgba(255,255,255,0.5)" strokeDasharray="4 4" />
      {rows.map((row, index) => {
        const y = 30 + index * rowHeight;
        const color = row.isReference ? 'rgba(255,255,255,0.6)' : row.significant ? '#f97316' : '#14b8a6';
        return (
          <g key={row.label}>
            <text x={left - 12} y={y + 4} textAnchor="end" fontSize={12} fill="rgba(255,255,255,0.8)">{row.isReference ? 'Not measured (ref.)' : shortExposureLabel(row.key, row.label)}</text>
            {!row.isReference && <line x1={x(row.low)} x2={x(row.high)} y1={y} y2={y} stroke={color} strokeWidth={2} />}
            <circle cx={x(row.odds)} cy={y} r={row.isReference ? 4 : 5} fill={color} />
            {!row.isReference && (
              <text x={x(row.odds)} y={y + 22} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.65)">
                {row.odds.toFixed(2)} ({row.low.toFixed(2)}–{row.high.toFixed(2)}) · p {formatPValue(row.pValue ?? 1)}
              </text>
            )}
          </g>
        );
      })}
      <text x={left + (width - left) / 2} y={height - 1} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.45)">
        Odds ratio, log scale (below 1 = fewer readmissions than reference)
      </text>
    </svg>
  );
}

export function Hba1cStudyView({ study }: { study: Hba1cStudy }) {
  const boxes = consortBoxes(study);
  const bars = rateBars(study);
  const matrix = stratifiedMatrix(study);
  const paper = study.paper_comparison;

  return (
    <div className="space-y-4">
      <Panel
        title="HbA1c measurement and 30-day readmission"
        subtitle="A replication-style analysis of the question posed by Strack et al. (2014) on this same dataset. Not an exact reproduction of the published cohort."
        aside={<span className="text-[10px] uppercase tracking-widest rounded-full border border-white/15 px-3 py-1 text-white/50">Observational</span>}
      >
        <p className="text-xs text-white/50 mb-4">{paper.citation}</p>
        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Cohort flow</p>
        <div className="flex flex-col md:flex-row md:flex-wrap gap-2 items-stretch">
          {boxes.map((box, index) => (
            <React.Fragment key={box.step}>
              <div className="flex-1 min-w-[170px] rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-lg font-semibold text-white">{formatCount(box.encounters)}</p>
                <p className="text-[11px] text-white/60 leading-snug">{box.description}</p>
                {box.removed > 0 && <p className="text-[11px] text-amber-300 mt-1">−{formatCount(box.removed)} removed</p>}
              </div>
              {index < boxes.length - 1 && <div className="hidden md:flex items-center text-white/30">→</div>}
            </React.Fragment>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel
          title="30-day readmission rate by group"
          aside={<AskAboutButton prompt="Compare the 30-day readmission rate (readmitted = '<30') by HbA1c test result (a1cresult)" />}
          subtitle={`Error bars are 95% Wilson intervals. Chi-square across groups: χ²(${study.chi_square.dof}) = ${study.chi_square.chi2.toFixed(2)}, p = ${formatPValue(study.chi_square.p_value)}, Cramér's V = ${study.chi_square.cramers_v.toFixed(3)} (a very small association).`}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars} margin={{ top: 10, right: 15, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} interval={0} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} unit="%" domain={[0, 'auto']} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Rate']} />
                <Bar dataKey="ratePercent" shape={BarWithInterval} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-white/40">Group sizes: {bars.map((bar) => `${bar.label} n=${formatCount(bar.n)}`).join(' · ')}</p>
        </Panel>

        <Panel
          title="Adjusted odds ratios"
          subtitle={`Logistic regression (n = ${formatCount(study.adjusted_model.n)}) adjusted for ${study.adjusted_model.adjusted_for.join(', ')}.`}
        >
          <ForestPlot study={study} />
        </Panel>
      </div>

      <Panel title="Does the association depend on primary diagnosis?" subtitle={study.interaction.interpretation}>
        <p className="text-xs text-white/50 mb-3">
          Likelihood-ratio test of exposure × diagnosis interaction: χ²({study.interaction.df}) = {study.interaction.lr_statistic.toFixed(2)}, p = {formatPValue(study.interaction.p_value)}.
        </p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-white/40">
              <tr>
                <th className="px-3 py-2 font-medium">Primary diagnosis</th>
                {matrix.exposures.map((exposure) => (
                  <th key={exposure} className="px-3 py-2 font-medium">{study.exposure_definitions[exposure]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.diagnoses.map((diagnosis) => (
                <tr key={diagnosis} className="border-t border-white/5 text-white/80">
                  <td className="px-3 py-2 font-medium">{diagnosis}</td>
                  {matrix.exposures.map((exposure) => {
                    const cell = matrix.cells[`${diagnosis}|${exposure}`];
                    return (
                      <td key={exposure} className="px-3 py-2">
                        {cell ? (
                          <>
                            {formatPercent(cell.rate)} <span className="text-white/40 text-xs">n={formatCount(cell.n)}</span>
                          </>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="How this compares with the published study">
        <p className="text-sm text-white/80">
          <span className="text-white/50">Paper&apos;s headline (stated qualitatively): </span>
          {paper.headline_finding_of_paper}
        </p>
        <p className="text-sm text-white/80 mt-3">
          <span className="text-white/50">This analysis: </span>
          {paper.our_results} {paper.assessment}
        </p>
        <p className="text-xs text-amber-200/80 mt-3">{paper.note}</p>
        <ul className="list-disc pl-5 mt-4 space-y-1 text-xs text-white/50">
          {study.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

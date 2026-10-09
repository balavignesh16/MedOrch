import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildCostSqlExpression, calculateGrowth } from './calculations';
import { calculateReadmissionRate } from './aggregation';
import { buildWhereClause } from './sqlBuilder';
import { normalizeFilters } from './filters';
import { FINANCIAL_COST_MULTIPLIERS as COST } from './config';
import { OPERATIONAL_DEMO_ASSUMPTIONS as OPERATIONAL_DEMO } from './config';
import { ENCOUNTER_RISK_CASE_SQL, ENCOUNTER_RISK_FILTER_SQL } from './config';

describe('analytics calculations', () => {
  it('calculates readmission rate', () => {
    expect(calculateReadmissionRate(200, 25)).toBe(12.5);
    expect(calculateReadmissionRate(0, 25)).toBe(0);
  });

  it('calculates growth safely', () => {
    expect(calculateGrowth(120, 100)).toBe(20);
    expect(calculateGrowth(5, 0)).toBe(0);
  });

  it('uses parameterized filter values', () => {
    const result = buildWhereClause({ gender: 'Female', age: '[70-80)' });
    expect(result.whereClause).toBe('WHERE gender = ? AND age = ?');
    expect(result.params).toEqual(['Female', '[70-80)']);
  });

  it('drops unsupported and invalid filter values', () => {
    expect(normalizeFilters({
      gender: ' Female ',
      readmitted: 'MAYBE',
      los: 'all',
      medCount: '11-20',
      riskLevel: 'High',
      timeframe: 'last-30-days',
      department: 'ICU',
    })).toEqual({ gender: 'Female', medCount: '11-20', riskLevel: 'High' });

    expect(buildWhereClause({ readmitted: 'MAYBE', los: 'all' })).toEqual({
      whereClause: '',
      params: [],
      conditionsCount: 0,
    });
  });

  it('keeps the estimated cost formula explicit', () => {
    const expression = buildCostSqlExpression();
    expect(expression).toContain(`time_in_hospital * ${COST.LOS_PER_DAY}`);
    expect(expression).toContain(`num_medications * ${COST.MEDICATION}`);
    expect(expression).toContain(`THEN ${COST.READMISSION_PENALTY}`);
  });

  it('keeps operational demo assumptions explicit', () => {
    expect(OPERATIONAL_DEMO.THROUGHPUT_PERIOD_DAYS).toBe(30);
    expect(OPERATIONAL_DEMO.BED_OCCUPANCY_BASE_PERCENT).toBe(70);
    expect(OPERATIONAL_DEMO.FLOW.emergency.volume).toBe(0.4);
  });

  it('uses one mutually exclusive encounter-risk definition', () => {
    expect(ENCOUNTER_RISK_CASE_SQL).toContain("THEN 'Critical'");
    expect(ENCOUNTER_RISK_CASE_SQL).toContain("THEN 'High'");
    expect(buildWhereClause({ riskLevel: 'High' }).whereClause)
      .toContain(ENCOUNTER_RISK_FILTER_SQL.High);
    expect(ENCOUNTER_RISK_FILTER_SQL.High).not.toBe(ENCOUNTER_RISK_FILTER_SQL.Critical);
  });

  it('does not present encounter-row metrics as patient counts', () => {
    const sourceFiles = [
      '../../app/population/page.tsx',
      '../../components/population/cohort-explorer.tsx',
      '../../components/population/risk-charts.tsx',
      '../../components/population/disease-table.tsx',
      '../../components/quality/quality-kpi-grid.tsx',
      '../../components/quality/readmission-intelligence.tsx',
      '../../components/quality/los-analytics.tsx',
      '../../components/quality/medication-quality.tsx',
      '../../components/quality/utilization-analysis.tsx',
      '../../components/quality/quality-insights.tsx',
      '../../components/population/population-empty-state.tsx',
    ];
    const combinedSource = sourceFiles
      .map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'))
      .join('\n');

    expect(combinedSource).not.toMatch(/Total Patients|Avg Meds \/ Patient|High Risk Patients/);
    expect(combinedSource).not.toMatch(/>Patients<| patients<\/span>| pts\s|No Patients Found/);
  });
});

import { safeQuery, safeGetQuery } from './cache';
import { buildWhereClause, buildQuery } from './sqlBuilder';
import { AnalyticsFilterState, AggregationResult, CoreMetricResult, SqlValue } from './types';

type AnalyticsTable = 'hospital_readmissions';
type GroupableColumn = 'age' | 'gender' | 'race' | 'admission_type_id' | 'discharge_disposition_id';

export class QueryFactory {
  static executeCoreMetrics(tableName: AnalyticsTable, filters: AnalyticsFilterState): CoreMetricResult {
    // Conditioning this metric set on its outcome would create a misleading rate.
    const metricFilters = { ...filters };
    delete metricFilters.readmitted;
    const { whereClause, params } = buildWhereClause(metricFilters);

    const row = safeGetQuery<{
      total_encounters: number;
      readmission_numerator: number;
      readmission_denominator: number;
      avg_los: number | null;
    }>(`
      WITH unique_encounters AS (
        SELECT encounter_id
        FROM ${tableName}
        WHERE encounter_id IS NOT NULL
          AND typeof(encounter_id) = 'integer'
          AND encounter_id > 0
        GROUP BY encounter_id
        HAVING COUNT(*) = 1
      ), eligible AS (
        SELECT source.*
        FROM ${tableName} AS source
        INNER JOIN unique_encounters USING (encounter_id)
        ${whereClause}
      )
      SELECT
        COUNT(*) AS total_encounters,
        COUNT(CASE WHEN readmitted = '<30' THEN 1 END) AS readmission_numerator,
        COUNT(CASE WHEN readmitted IN ('<30', '>30', 'NO') THEN 1 END) AS readmission_denominator,
        AVG(CASE
          WHEN typeof(time_in_hospital) IN ('integer', 'real')
            AND time_in_hospital BETWEEN 1 AND 14
          THEN CAST(time_in_hospital AS REAL)
        END) AS avg_los
      FROM eligible
    `, params, {
      total_encounters: 0,
      readmission_numerator: 0,
      readmission_denominator: 0,
      avg_los: null,
    });

    return {
      totalEncounters: row.total_encounters,
      readmissionNumerator: row.readmission_numerator,
      readmissionDenominator: row.readmission_denominator,
      readmissionProxyRate: row.readmission_denominator > 0
        ? (row.readmission_numerator / row.readmission_denominator) * 100
        : 0,
      avgLengthOfStay: row.avg_los,
    };
  }

  
  static executeCount(tableName: AnalyticsTable, filters: AnalyticsFilterState, additionalCondition?: string): number {
    const { whereClause, params } = buildWhereClause(filters);
    const finalWhere = additionalCondition 
      ? (whereClause ? `${whereClause} AND ${additionalCondition}` : `WHERE ${additionalCondition}`) 
      : whereClause;
      
    const row = safeGetQuery<{ count: number }>(`SELECT COUNT(*) as count FROM ${tableName} ${finalWhere}`, params, { count: 0 });
    return row.count;
  }

  static executeAggregation(tableName: AnalyticsTable, filters: AnalyticsFilterState): AggregationResult {
    const { whereClause, params } = buildWhereClause(filters);
    
    const query = `
      SELECT 
        COUNT(*) as count,
        AVG(time_in_hospital) as avg_time,
        AVG(num_medications) as avg_meds,
        AVG(number_emergency) as avg_er,
        AVG(num_procedures) as avg_proc
      FROM ${tableName}
      ${whereClause}
    `;
    
    return safeGetQuery<AggregationResult>(query, params, {
      count: 0, avg_time: 0, avg_meds: 0, avg_er: 0, avg_proc: 0
    });
  }

  static executeGroupedCount<T>(tableName: AnalyticsTable, groupBy: GroupableColumn, filters: AnalyticsFilterState, limit?: number): T[] {
    const { query, params } = buildQuery(`CAST(${groupBy} AS TEXT) as category, COUNT(*) as count`, tableName, filters, groupBy, `count DESC`, limit);
    return safeQuery<T[]>(query, params, []);
  }

  static executeCustomQuery<T>(sql: string, params: readonly SqlValue[], fallback: T): T {
    return safeQuery<T>(sql, params, fallback);
  }

  static executeCustomGet<T>(sql: string, params: readonly SqlValue[], fallback: T): T {
    return safeGetQuery<T>(sql, params, fallback);
  }
}

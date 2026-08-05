import { safeQuery, safeGetQuery } from './cache';
import { buildWhereClause, buildQuery } from './sqlBuilder';
import { AnalyticsFilterState, AggregationResult } from './types';

export class QueryFactory {
  
  static executeCount(tableName: string, filters: AnalyticsFilterState, additionalCondition?: string): number {
    const { whereClause, params } = buildWhereClause(filters);
    const finalWhere = additionalCondition 
      ? (whereClause ? `${whereClause} AND ${additionalCondition}` : `WHERE ${additionalCondition}`) 
      : whereClause;
      
    const row = safeGetQuery<{ count: number }>(`SELECT COUNT(*) as count FROM ${tableName} ${finalWhere}`, params, { count: 0 });
    return row.count;
  }

  static executeAggregation(tableName: string, filters: AnalyticsFilterState): AggregationResult {
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

  static executeGroupedCount<T>(tableName: string, groupBy: string, filters: AnalyticsFilterState, limit?: number): T[] {
    const { query, params } = buildQuery(`CAST(${groupBy} AS TEXT) as category, COUNT(*) as count`, tableName, filters, groupBy, `count DESC`, limit);
    return safeQuery<T>(query, params, []);
  }

  static executeCustomQuery<T>(sql: string, params: any[], fallback: T): T {
    return safeQuery<T>(sql, params, fallback);
  }

  static executeCustomGet<T>(sql: string, params: any[], fallback: T): T {
    return safeGetQuery<T>(sql, params, fallback);
  }
}

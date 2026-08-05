import { AnalyticsFilterState, AnalyticsQuery } from './types';

export function buildWhereClause(filters: AnalyticsFilterState = {}): AnalyticsQuery {
  const conditions: string[] = [];
  const params: any[] = [];

  // Shared Demographics & Clinical
  if (filters.gender) { conditions.push(`gender = ?`); params.push(filters.gender); }
  if (filters.age) { conditions.push(`age = ?`); params.push(filters.age); }
  if (filters.race) { conditions.push(`race = ?`); params.push(filters.race); }
  if (filters.admission_type_id) { conditions.push(`admission_type_id = ?`); params.push(filters.admission_type_id); }
  if (filters.discharge_disposition_id) { conditions.push(`discharge_disposition_id = ?`); params.push(filters.discharge_disposition_id); }
  if (filters.readmitted) { conditions.push(`readmitted = ?`); params.push(filters.readmitted); }
  if (filters.diag_1) { conditions.push(`diag_1 = ?`); params.push(filters.diag_1); }

  // Quality Specific Filters
  if (filters.los) {
    if (filters.los === '0-3') { conditions.push(`time_in_hospital <= 3`); }
    else if (filters.los === '4-7') { conditions.push(`time_in_hospital > 3 AND time_in_hospital <= 7`); }
    else if (filters.los === '8+') { conditions.push(`time_in_hospital > 7`); }
  }
  
  if (filters.medCount) {
    if (filters.medCount === '0-10') { conditions.push(`num_medications <= 10`); }
    else if (filters.medCount === '11-20') { conditions.push(`num_medications > 10 AND num_medications <= 20`); }
    else if (filters.medCount === '20+') { conditions.push(`num_medications > 20`); }
  }

  // Risk level heuristic
  if (filters.riskLevel) {
    if (filters.riskLevel === 'Critical') {
      conditions.push(`(readmitted = '<30' AND time_in_hospital >= 10)`);
    } else if (filters.riskLevel === 'High') {
      conditions.push(`(readmitted = '<30' OR time_in_hospital >= 8 OR num_medications >= 20)`);
    } else if (filters.riskLevel === 'Medium') {
      conditions.push(`(readmitted = '>30' OR (time_in_hospital >= 4 AND time_in_hospital < 8))`);
    } else if (filters.riskLevel === 'Low') {
      conditions.push(`(readmitted = 'NO' AND time_in_hospital < 4 AND num_medications < 20)`);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params, conditionsCount: conditions.length };
}

export function buildQuery(selectFields: string, tableName: string, filters: AnalyticsFilterState, groupBy?: string, orderBy?: string, limit?: number) {
  const { whereClause, params } = buildWhereClause(filters);
  
  let query = `SELECT ${selectFields} FROM ${tableName} ${whereClause}`;
  if (groupBy) query += ` GROUP BY ${groupBy}`;
  if (orderBy) query += ` ORDER BY ${orderBy}`;
  if (limit) query += ` LIMIT ${limit}`;

  return { query, params };
}

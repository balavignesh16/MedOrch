import Database from 'better-sqlite3';
import { getDatabasePath } from '@/lib/databaseConfig';
import type { SqlValue } from './types';

let dbInstance: Database.Database | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new Database(getDatabasePath(), { readonly: true });
    dbInstance.pragma('query_only = ON');
  }
  return dbInstance;
}

export function closeAnalyticsDatabase(): void {
  dbInstance?.close();
  dbInstance = null;
}

export function safeQuery<T>(query: string, params: readonly SqlValue[] = [], fallback: T): T {
  try {
    const db = getDb();
    return db.prepare(query).all(...params) as T;
  } catch (error) {
    console.error(`Database query failed: ${query}`, error);
    return fallback;
  }
}

export function safeGetQuery<T>(query: string, params: readonly SqlValue[] = [], fallback: T): T {
  try {
    const db = getDb();
    const res = db.prepare(query).get(...params) as T;
    return res || fallback;
  } catch (error) {
    console.error(`Database query failed: ${query}`, error);
    return fallback;
  }
}

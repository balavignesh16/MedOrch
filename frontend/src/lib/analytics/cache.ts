import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), '../database/medorch.db');

let dbInstance: Database.Database | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new Database(dbPath, { readonly: true });
  }
  return dbInstance;
}

export function safeQuery<T>(query: string, params: any[] = [], fallback: T): T {
  try {
    const db = getDb();
    return db.prepare(query).all(...params) as T;
  } catch (error) {
    console.error(`Database query failed: ${query}`, error);
    return fallback;
  }
}

export function safeGetQuery<T>(query: string, params: any[] = [], fallback: T): T {
  try {
    const db = getDb();
    const res = db.prepare(query).get(...params) as T;
    return res || fallback;
  } catch (error) {
    console.error(`Database query failed: ${query}`, error);
    return fallback;
  }
}

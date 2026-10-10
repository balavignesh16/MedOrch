import { existsSync } from 'fs';
import Database from 'better-sqlite3';
import { getAuditDatabasePath } from '@/lib/auditDatabaseConfig';

interface ModelUsageRow {
  model_version: string;
  request_count: number;
}

// Google does not expose a live "requests remaining" API for Gemini — the
// daily limit only appears inside a 429 error's body after you've already
// hit it (observed: "limit: 20" for the free tier's gemini-3.8-flash, the
// model gemini-flash-latest currently resolves to). This is that
// last-observed number, not a live query — see ai.dev/rate-limit for the
// authoritative current value, which can change without notice.
const GEMINI_FREE_TIER_DAILY_LIMIT_OBSERVED = 20;

export async function GET() {
  const dbPath = getAuditDatabasePath();
  if (!existsSync(dbPath)) {
    return Response.json({
      date_utc: new Date().toISOString().slice(0, 10),
      counts: [],
      gemini_daily_limit_observed: GEMINI_FREE_TIER_DAILY_LIMIT_OBSERVED,
      note: 'No audit log found yet — no requests have been made since the engine last started.',
    });
  }

  try {
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
    db.pragma('query_only = ON');
    try {
      const rows = db
        .prepare(
          `SELECT model_version, COUNT(*) AS request_count
           FROM audit_log
           WHERE date(timestamp_utc) = date('now')
           GROUP BY model_version
           ORDER BY request_count DESC`,
        )
        .all() as ModelUsageRow[];

      return Response.json({
        date_utc: new Date().toISOString().slice(0, 10),
        counts: rows,
        gemini_daily_limit_observed: GEMINI_FREE_TIER_DAILY_LIMIT_OBSERVED,
        note:
          'Counts are requests MedOrch itself made today, tracked in its own audit log — ' +
          'not a live quota API. Google does not expose one; see ai.dev/rate-limit for the ' +
          'authoritative current limit.',
      });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Failed to read audit database for usage stats:', error);
    return Response.json({
      date_utc: new Date().toISOString().slice(0, 10),
      counts: [],
      gemini_daily_limit_observed: GEMINI_FREE_TIER_DAILY_LIMIT_OBSERVED,
      note: 'Usage data is temporarily unavailable.',
    });
  }
}

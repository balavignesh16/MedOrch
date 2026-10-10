import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GET } from './route';

let fixtureDirectory = '';
let databasePath = '';

function createFixtureAuditDatabase(rows: Array<{ model_version: string }>): void {
  const db = new Database(databasePath);
  db.exec(`
    CREATE TABLE audit_log (
      audit_id TEXT PRIMARY KEY,
      timestamp_utc TEXT NOT NULL,
      model_version TEXT NOT NULL
    );
  `);
  const insert = db.prepare('INSERT INTO audit_log (audit_id, timestamp_utc, model_version) VALUES (?, ?, ?)');
  rows.forEach((row, index) => {
    insert.run(`audit-${index}`, new Date().toISOString(), row.model_version);
  });
  db.close();
}

beforeEach(() => {
  fixtureDirectory = mkdtempSync(path.join(tmpdir(), 'medorch-usage-route-'));
  databasePath = path.join(fixtureDirectory, 'audit.db');
  process.env.AI_AUDIT_DB_PATH = databasePath;
});

afterEach(() => {
  delete process.env.AI_AUDIT_DB_PATH;
  rmSync(fixtureDirectory, { recursive: true, force: true });
});

describe('GET /api/assistant/usage', () => {
  it('returns today\'s request counts grouped by model', async () => {
    createFixtureAuditDatabase([
      { model_version: 'gemini-flash-latest' },
      { model_version: 'gemini-flash-latest' },
      { model_version: 'qwen2.5:14b-instruct' },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.counts).toEqual(
      expect.arrayContaining([
        { model_version: 'gemini-flash-latest', request_count: 2 },
        { model_version: 'qwen2.5:14b-instruct', request_count: 1 },
      ]),
    );
  });

  it('never claims to be a live Google quota API', async () => {
    createFixtureAuditDatabase([{ model_version: 'gemini-flash-latest' }]);
    const response = await GET();
    const body = await response.json();
    expect(body.note.toLowerCase()).toContain('not a live quota api');
  });

  it('returns a safe empty result when no audit log exists yet', async () => {
    process.env.AI_AUDIT_DB_PATH = path.join(fixtureDirectory, 'missing.db');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.counts).toEqual([]);
  });

  it('includes the last-observed Gemini free-tier limit as a labeled estimate, not a live number', async () => {
    createFixtureAuditDatabase([]);
    const response = await GET();
    const body = await response.json();
    expect(body.gemini_daily_limit_observed).toBe(20);
  });
});

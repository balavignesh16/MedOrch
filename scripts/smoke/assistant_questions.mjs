// Runs the curated demo questions against the live stack and reports pass/fail and latency.
//
//   node scripts/smoke/assistant_questions.mjs [--base http://localhost:3000] [--repeats 3]
//                                              [--model qwen2.5-14b] [--only general-average-los]
//
// A run passes when the assistant returns EXECUTION_STATUS_OK with no error code and the same
// number of result rows as the reference SQL in config/demo_questions.json. "narrative" records
// whether a written explanation appeared (rather than the terse table caption).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, index, all) => (arg.startsWith('--') ? [...pairs, [arg.slice(2), all[index + 1]]] : pairs), []),
);
const base = args.base ?? 'http://localhost:3000';
const repeats = Number(args.repeats ?? 1);
const modelProfile = args.model ?? '';
const only = args.only;

const { questions } = JSON.parse(readFileSync(path.join(root, 'config', 'demo_questions.json'), 'utf-8'));
const require = createRequire(path.join(root, 'frontend', 'package.json'));
const Database = require('better-sqlite3');
const db = new Database(path.join(root, 'database', 'medorch.db'), { readonly: true });
const expectedRows = (sql) => db.prepare(sql).all().length;

async function ask(question) {
  const started = Date.now();
  const response = await fetch(`${base}/api/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: question.prompt, agent_target: question.context, model_profile_id: modelProfile }),
    signal: AbortSignal.timeout(170_000),
  });
  if (!response.ok || !response.body) return { ok: false, reason: `HTTP ${response.status}`, ms: Date.now() - started };

  let final = null;
  let buffer = '';
  const decoder = new TextDecoder();
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      if (!part.startsWith('data: ')) continue;
      try {
        const event = JSON.parse(part.slice(6));
        if (event.isFinal) final = event;
      } catch {
        // ignore malformed partial events
      }
    }
  }
  const ms = Date.now() - started;
  if (!final) return { ok: false, reason: 'no final event', ms };
  if (final.executionStatus !== 'EXECUTION_STATUS_OK' || final.errorCode) {
    return { ok: false, reason: `${final.executionStatus} ${final.errorCode}`.trim(), ms };
  }
  let rowCount = null;
  try {
    rowCount = JSON.parse(final.visualizationDataJson).row_count;
  } catch {
    rowCount = null;
  }
  const expected = expectedRows(question.expected_sql);
  const narrative = !/grouped result\(s\)|\(from \d+ row/.test(final.summaryText);
  if (rowCount !== expected) return { ok: false, reason: `row_count ${rowCount} != expected ${expected}`, ms, narrative };
  return { ok: true, ms, narrative };
}

const selected = questions.filter((q) => !only || q.id === only);
const results = [];
for (const question of selected) {
  const runs = [];
  for (let i = 0; i < repeats; i++) {
    try {
      runs.push(await ask(question));
    } catch (error) {
      runs.push({ ok: false, reason: String(error?.message ?? error), ms: 0 });
    }
  }
  const passed = runs.filter((r) => r.ok).length;
  const narratives = runs.filter((r) => r.narrative).length;
  const times = runs.map((r) => r.ms).sort((a, b) => a - b);
  const failures = [...new Set(runs.filter((r) => !r.ok).map((r) => r.reason))];
  results.push({ id: question.id, passed, runs: runs.length, narratives, medianMs: times[Math.floor(times.length / 2)], failures });
  console.log(
    `${passed === runs.length ? 'PASS' : 'FAIL'}  ${question.id.padEnd(36)} ${passed}/${runs.length} ok  ${narratives}/${runs.length} narrative  median ${(times[Math.floor(times.length / 2)] / 1000).toFixed(1)}s` +
      (failures.length ? `  [${failures.join('; ')}]` : ''),
  );
}

const total = results.reduce((sum, r) => sum + r.runs, 0);
const ok = results.reduce((sum, r) => sum + r.passed, 0);
console.log(`\n${ok}/${total} runs passed across ${results.length} questions`);
mkdirSync(path.join(root, 'tmp', 'smoke'), { recursive: true });
writeFileSync(path.join(root, 'tmp', 'smoke', 'assistant_questions.json'), JSON.stringify({ at: new Date().toISOString(), base, repeats, modelProfile, results }, null, 2));
process.exit(ok === total ? 0 : 1);

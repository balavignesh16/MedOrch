// Walks every page in headless Chrome and fails on console errors, HTTP errors, empty pages,
// or text that must never appear (known invented values). Also renders /report to PDF.
//
//   node scripts/smoke/walk.mjs [--base http://localhost:3000] [--out tmp/smoke]
//
// Needs Chrome or Edge installed and the stack running (start.bat / start.sh).
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, index, all) => (arg.startsWith('--') ? [...pairs, [arg.slice(2), all[index + 1]]] : pairs), []),
);
const base = args.base ?? 'http://localhost:3000';
const outDir = path.resolve(root, args.out ?? 'tmp/smoke');
mkdirSync(outDir, { recursive: true });

const PAGES = ['/', '/population', '/quality', '/operations', '/financial', '/administration', '/strategy', '/predictive', '/research', '/data-quality', '/report', '/assistant'];

/** Values that were once invented and must not reappear. */
const BANNED = [
  'Seattle', 'Sprint [0-9]', 'DEP-0', 'Forecast Accuracy', 'System Optimal', '99\\.99', 'Enterprise Readiness',
  'ICU Capacity', 'Critical Alerts', 'Cardiology ICU', '94\\.2%', '\\b45m\\b', '\\b2\\.5h\\b',
];
/** The strategy page explains that it deliberately shows no ROI; elsewhere the word would be a red flag. */
const BANNED_EXCEPT_STRATEGY = ['\\bROI\\b'];

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const chromePath = candidates.find((candidate) => existsSync(candidate));
if (!chromePath) {
  console.error('No Chrome/Edge found. Set CHROME_PATH.');
  process.exit(2);
}

const port = 9800 + Math.floor(Math.random() * 150);
const profile = path.join(os.tmpdir(), `medorch-smoke-${port}`);
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1400,1000', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let targets;
for (let i = 0; i < 40; i++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    if (targets.length) break;
  } catch {
    // Chrome still starting
  }
  await sleep(250);
}
if (!targets) {
  console.error('Chrome did not start.');
  chrome.kill();
  process.exit(2);
}

const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve) => (ws.onopen = resolve));
let nextId = 0;
const pending = new Map();
let problems = [];
ws.onmessage = (message) => {
  const data = JSON.parse(message.data);
  if (data.id && pending.has(data.id)) {
    pending.get(data.id)(data);
    pending.delete(data.id);
    return;
  }
  if (data.method === 'Runtime.exceptionThrown') problems.push(`exception: ${(data.params.exceptionDetails.exception?.description ?? data.params.exceptionDetails.text).slice(0, 160)}`);
  if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') problems.push(`console.error: ${data.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 160)}`);
  if (data.method === 'Network.responseReceived' && data.params.response.status >= 400 && !/favicon/.test(data.params.response.url)) problems.push(`HTTP ${data.params.response.status} ${data.params.response.url}`);
};
const send = (method, params = {}) => new Promise((resolve) => {
  const id = ++nextId;
  pending.set(id, resolve);
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Page.bringToFront');
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false });

const origin = new URL(base).origin;
await send('Page.navigate', { url: `${origin}/login` });
await sleep(2500);
await evaluate("localStorage.setItem('medorch_user', JSON.stringify({ name: 'Smoke Test', role: 'admin' }))");

let failures = 0;
for (const page of PAGES) {
  problems = [];
  await send('Page.navigate', { url: origin + page });
  let text = '';
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    text = (await evaluate('document.body.innerText')) ?? '';
    if (text.length > 400 && !text.includes('Loading...')) break;
  }
  const patterns = page === '/strategy' ? BANNED : [...BANNED, ...BANNED_EXCEPT_STRATEGY];
  const banned = patterns.filter((pattern) => new RegExp(pattern, 'i').test(text));
  const heading = await evaluate("document.querySelector('h1,h2')?.innerText ?? ''");
  const broken = /Application error|Internal Server Error|could not be loaded|needs a generated artifact/i.test(text);

  const reasons = [];
  if (text.length <= 400) reasons.push(`page nearly empty (${text.length} chars)`);
  if (!heading) reasons.push('no heading');
  if (broken) reasons.push('error or missing-artifact notice shown');
  if (banned.length) reasons.push(`banned text: ${banned.join(', ')}`);
  reasons.push(...[...new Set(problems)]);

  const height = (await evaluate("(() => { const r = document.querySelector('div.h-screen'); if (r) { r.style.height = 'auto'; r.style.overflow = 'visible'; } const m = document.querySelector('main.overflow-y-auto'); if (m) m.style.overflow = 'visible'; return document.documentElement.scrollHeight; })()")) ?? 1000;
  await sleep(400);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1400, height: Math.min(height, 7000), scale: 1 } });
  writeFileSync(path.join(outDir, `${page === '/' ? 'home' : page.slice(1).replace(/\//g, '_')}.png`), Buffer.from(shot.result.data, 'base64'));

  if (reasons.length) failures++;
  console.log(`${reasons.length ? 'FAIL' : 'PASS'}  ${page.padEnd(15)} ${heading.replace(/\s+/g, ' ').slice(0, 44).padEnd(44)} ${reasons.join(' | ')}`);
}

await send('Page.navigate', { url: `${origin}/report` });
await sleep(4000);
await send('Emulation.setEmulatedMedia', { media: 'print' });
const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
const pdfBytes = Buffer.from(pdf.result.data, 'base64');
writeFileSync(path.join(outDir, 'report.pdf'), pdfBytes);
const pageCount = (pdfBytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
const pdfOk = pdfBytes.length > 50_000 && pageCount >= 3;
if (!pdfOk) failures++;
console.log(`${pdfOk ? 'PASS' : 'FAIL'}  /report (PDF)   ${pageCount} pages, ${(pdfBytes.length / 1024).toFixed(0)} KB`);

ws.close();
chrome.kill();
console.log(`\n${failures === 0 ? 'All pages passed.' : `${failures} check(s) failed.`} Screenshots and report.pdf are in ${path.relative(root, outDir)}.`);
process.exit(failures === 0 ? 0 : 1);

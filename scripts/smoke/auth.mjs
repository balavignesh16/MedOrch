// Shared sign-in for the smoke scripts. Credentials come from SMOKE_USERNAME / SMOKE_PASSWORD, or from the
// git-ignored database/demo_credentials.txt written when the demo users were first created.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function smokeCredentials(preferredUser = 'admin') {
  if (process.env.SMOKE_USERNAME && process.env.SMOKE_PASSWORD) {
    return { username: process.env.SMOKE_USERNAME, password: process.env.SMOKE_PASSWORD };
  }
  const file = path.join(root, 'database', 'demo_credentials.txt');
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf-8').split(/\r?\n/)) {
      const [username, password] = line.split('|').map((part) => part.trim());
      if (username === preferredUser && password) return { username, password };
    }
  }
  return null;
}

/** Signs in over HTTP and returns the session cookie header value, or throws with a clear message. */
export async function signIn(base, credentials = smokeCredentials()) {
  if (!credentials) {
    throw new Error('No credentials: set SMOKE_USERNAME and SMOKE_PASSWORD, or sign in once so database/demo_credentials.txt exists.');
  }
  const response = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) throw new Error(`Sign-in failed (HTTP ${response.status}) for user "${credentials.username}".`);
  const cookies = response.headers.getSetCookie().map((cookie) => cookie.split(';')[0]);
  if (cookies.length === 0) throw new Error('Sign-in succeeded but no session cookie was returned.');
  return cookies.join('; ');
}

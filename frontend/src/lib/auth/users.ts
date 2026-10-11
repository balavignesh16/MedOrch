import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomInt } from 'node:crypto';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { Role } from '@/lib/navigation';
import { hashPassword, verifyPassword } from './password';
import type { SessionUser } from './session';

export interface DemoUser {
  username: string;
  displayName: string;
  role: Role;
}

export interface DemoCredential extends DemoUser {
  password: string;
}

export const DEMO_USERS: DemoUser[] = [
  { username: 'admin', displayName: 'Hospital Administrator', role: 'admin' },
  { username: 'doctor', displayName: 'Attending Physician', role: 'doctor' },
  { username: 'billing', displayName: 'Billing Specialist', role: 'billing' },
];

const PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // no look-alike characters
const ROLES: readonly string[] = ['admin', 'doctor', 'billing'];

/** Three groups of four, e.g. "kmpx-7tqd-hn3z" (about 59 bits). */
export function generatePassword(): string {
  const group = () => Array.from({ length: 4 }, () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]).join('');
  return `${group()}-${group()}-${group()}`;
}

export function getUsersDatabasePath(env: Record<string, string | undefined> = process.env): string {
  const configured = env.MEDORCH_USERS_DB_PATH;
  if (!configured) return path.resolve(/* turbopackIgnore: true */ process.cwd(), '../database/users.db');
  return path.isAbsolute(configured) ? configured : path.resolve(/* turbopackIgnore: true */ process.cwd(), '..', configured);
}

export function credentialsFilePath(usersDatabasePath: string): string {
  return path.join(path.dirname(usersDatabasePath), 'demo_credentials.txt');
}

export function openUsersDatabase(databasePath: string): Database.Database {
  mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new Database(databasePath);
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'billing')),
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
  return db;
}

interface EnsureOptions {
  /** Where newly created plaintext credentials are written for the operator; null disables it. */
  credentialsFile?: string | null;
  env?: Record<string, string | undefined>;
  now?: () => Date;
}

/** Creates any missing demo user. Only hashes are stored in the database; the plaintext passwords of newly
 * created users are returned and written once to the (git-ignored) credentials file. */
export async function ensureDemoUsers(db: Database.Database, options: EnsureOptions = {}): Promise<DemoCredential[]> {
  const env = options.env ?? process.env;
  const now = options.now ?? (() => new Date());
  const created: DemoCredential[] = [];
  const insert = db.prepare('INSERT INTO users (username, display_name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?)');

  for (const user of DEMO_USERS) {
    const exists = db.prepare('SELECT 1 AS present FROM users WHERE username = ?').get(user.username);
    if (exists) continue;
    const override = env[`MEDORCH_DEMO_PASSWORD_${user.role.toUpperCase()}`]?.trim();
    const password = override || generatePassword();
    insert.run(user.username, user.displayName, user.role, await hashPassword(password), now().toISOString());
    created.push({ ...user, password });
  }

  if (created.length > 0 && options.credentialsFile) {
    const existing = existsSync(options.credentialsFile)
      ? readFileSync(options.credentialsFile, 'utf-8').split(/\r?\n/).filter((line) => line.includes('|'))
      : [];
    const kept = existing.filter((line) => !created.some((c) => line.startsWith(`${c.username} |`)));
    const lines = [
      '# MedOrch demo credentials (generated on first login attempt; this file is git-ignored).',
      '# username | password | role',
      ...kept.filter((line) => !line.startsWith('#')),
      ...created.map((c) => `${c.username} | ${c.password} | ${c.role}`),
    ];
    writeFileSync(options.credentialsFile, `${lines.join('\n')}\n`, 'utf-8');
  }
  return created;
}

let dummyHash: string | null = null;

/** Verifies credentials. A missing user is checked against a dummy hash so timing does not reveal which usernames exist. */
export async function authenticateUser(db: Database.Database, username: string, password: string): Promise<SessionUser | null> {
  const row = db
    .prepare('SELECT username, display_name, role, password_hash FROM users WHERE username = ?')
    .get(username.trim().toLowerCase()) as { username: string; display_name: string; role: string; password_hash: string } | undefined;

  if (!row) {
    dummyHash ??= await hashPassword('medorch-timing-equaliser');
    await verifyPassword(password, dummyHash);
    return null;
  }
  const valid = await verifyPassword(password, row.password_hash);
  if (!valid || !ROLES.includes(row.role)) return null;
  return { username: row.username, displayName: row.display_name, role: row.role as Role };
}

let cachedDatabase: Database.Database | null = null;
let seeded = false;

/** Process-wide handle used by the login route; seeds the demo users on first use. */
export async function getUsersDatabase(): Promise<Database.Database> {
  if (!cachedDatabase) cachedDatabase = openUsersDatabase(getUsersDatabasePath());
  if (!seeded) {
    seeded = true;
    const created = await ensureDemoUsers(cachedDatabase, { credentialsFile: credentialsFilePath(getUsersDatabasePath()) });
    if (created.length > 0) {
      console.info(`Created ${created.length} demo user(s); credentials were written to ${credentialsFilePath(getUsersDatabasePath())}`);
    }
  }
  return cachedDatabase;
}

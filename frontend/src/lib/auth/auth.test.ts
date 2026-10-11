import { createHmac } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canAccess, decideAccess, rolesForPage, safeNextPath } from './access';
import { createLoginHandler, createLogoutHandler, createSessionHandler, type AuthHandlerDeps } from './handlers';
import { LoginLimiter } from './loginRateLimit';
import { hashPassword, verifyPassword } from './password';
import {
  createSessionToken, getSessionSecret, readCookie, SESSION_COOKIE, sessionCookieOptions, verifySessionToken, type SessionUser,
} from './session';
import { authenticateUser, DEMO_USERS, ensureDemoUsers, generatePassword, openUsersDatabase } from './users';

const SECRET = 'unit-test-secret-that-is-long-enough-for-anything';
const NOW = 1_800_000_000_000;
const admin: SessionUser = { username: 'admin', displayName: 'Hospital Administrator', role: 'admin' };

describe('password hashing', () => {
  it('verifies the right password and rejects wrong ones', async () => {
    const stored = await hashPassword('correct horse');
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(stored).not.toContain('correct horse');
    expect(await verifyPassword('correct horse', stored)).toBe(true);
    expect(await verifyPassword('correct horsf', stored)).toBe(false);
    expect(await verifyPassword('', stored)).toBe(false);
  });

  it('salts every hash and refuses malformed stored values', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
    for (const bad of ['', 'plaintext', 'scrypt$1$2$3', 'bcrypt$a$b$c$d$e', 'scrypt$x$8$1$AAAA$AAAA', 'scrypt$16384$8$1$AAAA$']) {
      expect(await verifyPassword('anything', bad)).toBe(false);
    }
  });
});

describe('signed sessions', () => {
  it('round-trips a user and carries no password material', () => {
    const token = createSessionToken(admin, SECRET, NOW);
    expect(verifySessionToken(token, SECRET, NOW + 1000)).toEqual(admin);
    expect(Buffer.from(token.split('.')[0], 'base64url').toString()).not.toMatch(/password|hash/i);
  });

  it('rejects a tampered role, a tampered signature and the wrong secret', () => {
    const token = createSessionToken({ ...admin, role: 'billing' }, SECRET, NOW);
    const [payload, signature] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString()), r: 'admin' })).toString('base64url');
    expect(verifySessionToken(`${forged}.${signature}`, SECRET, NOW)).toBeNull();
    expect(verifySessionToken(`${payload}.${signature.slice(0, -2)}AA`, SECRET, NOW)).toBeNull();
    expect(verifySessionToken(token, 'a-different-secret-entirely-than-before!!', NOW)).toBeNull();
  });

  it('rejects expired, malformed and unknown-role tokens', () => {
    const token = createSessionToken(admin, SECRET, NOW, 60);
    expect(verifySessionToken(token, SECRET, NOW + 59_000)).not.toBeNull();
    expect(verifySessionToken(token, SECRET, NOW + 61_000)).toBeNull();
    for (const bad of [undefined, null, '', 'abc', 'a.b.c', '.', 'x.y']) expect(verifySessionToken(bad, SECRET, NOW)).toBeNull();

    const payloadPart = Buffer.from(JSON.stringify({ u: 'root', n: 'Root', r: 'superuser', exp: NOW / 1000 + 100 })).toString('base64url');
    const signature = createHmac('sha256', SECRET).update(payloadPart).digest('base64url');
    expect(verifySessionToken(`${payloadPart}.${signature}`, SECRET, NOW)).toBeNull();
  });

  it('requires a real secret in production and allows a dev fallback otherwise', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(() => getSessionSecret({ NODE_ENV: 'production' })).toThrow(/SESSION_SECRET/);
    expect(() => getSessionSecret({ NODE_ENV: 'production', SESSION_SECRET: 'short' })).toThrow(/32/);
    expect(getSessionSecret({ NODE_ENV: 'production', SESSION_SECRET: 'x'.repeat(40) })).toBe('x'.repeat(40));
    expect(getSessionSecret({ NODE_ENV: 'development' }).length).toBeGreaterThan(20);
    expect(getSessionSecret({ NODE_ENV: 'development', SESSION_SECRET: 'custom' })).toBe('custom');
    vi.restoreAllMocks();
  });

  it('sets safe cookie attributes and parses the cookie header', () => {
    expect(sessionCookieOptions({ NODE_ENV: 'production' })).toMatchObject({ httpOnly: true, sameSite: 'lax', secure: true, path: '/' });
    expect(sessionCookieOptions({ NODE_ENV: 'development' }).secure).toBe(false);
    expect(sessionCookieOptions({ NODE_ENV: 'production', MEDORCH_INSECURE_COOKIES: 'true' }).secure).toBe(false);
    expect(readCookie('a=1; medorch_session=tok.en; b=2', 'medorch_session')).toBe('tok.en');
    expect(readCookie('a=1', 'medorch_session')).toBeUndefined();
    expect(readCookie(null, 'x')).toBeUndefined();
  });
});

describe('access rules', () => {
  it('requires a session for pages and APIs and keeps the login endpoints public', () => {
    expect(decideAccess('/predictive', '?a=1', null)).toEqual({ action: 'redirect', to: '/login?next=%2Fpredictive%3Fa%3D1' });
    expect(decideAccess('/api/stream', '', null)).toEqual({ action: 'unauthorized' });
    expect(decideAccess('/api/research/compare', '', null)).toEqual({ action: 'unauthorized' });
    for (const open of ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/session']) {
      expect(decideAccess(open, '', null)).toEqual({ action: 'allow' });
    }
    expect(decideAccess('/login', '', { role: 'admin' })).toEqual({ action: 'redirect', to: '/' });
  });

  it('enforces roles from the same table the sidebar uses, including nested routes', () => {
    expect(canAccess('doctor', '/operations')).toBe(false);
    expect(canAccess('billing', '/quality')).toBe(false);
    expect(canAccess('admin', '/administration')).toBe(true);
    expect(canAccess('doctor', '/administration')).toBe(false);
    expect(canAccess('billing', '/administration')).toBe(false);
    expect(canAccess('doctor', '/predictive')).toBe(true);
    expect(canAccess('billing', '/research')).toBe(true);
    expect(canAccess('doctor', '/')).toBe(true);
    expect(canAccess('billing', '/population/patient/123')).toBe(true);
    expect(rolesForPage('/operations/anything/else')).toEqual(['admin', 'billing']);
    expect(rolesForPage('/not-in-nav')).toBeNull();
  });

  it('answers 403 (not a redirect loop) for authenticated users who lack the role', () => {
    expect(decideAccess('/operations', '', { role: 'doctor' })).toEqual({ action: 'forbidden', api: false });
    expect(decideAccess('/api/patients/5', '', { role: 'billing' })).toEqual({ action: 'forbidden', api: true });
    expect(decideAccess('/api/patients/5', '', { role: 'doctor' })).toEqual({ action: 'allow' });
    expect(decideAccess('/api/stream', '', { role: 'billing' })).toEqual({ action: 'allow' });
  });

  it('accepts only same-site relative paths as login destinations', () => {
    expect(safeNextPath('/predictive?x=1')).toBe('/predictive?x=1');
    for (const bad of [null, undefined, '', 'https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '/login', '/login?next=/x', 'http://x/y']) {
      expect(safeNextPath(bad)).toBe('/');
    }
  });
});

describe('login rate limiter', () => {
  it('blocks after five failures and recovers when the window passes', () => {
    const limiter = new LoginLimiter(5, 60_000);
    for (let i = 0; i < 4; i++) limiter.recordFailure('k', 1000 + i);
    expect(limiter.check('k', 2000).blocked).toBe(false);
    limiter.recordFailure('k', 2000);
    const status = limiter.check('k', 3000);
    expect(status.blocked).toBe(true);
    expect(status.retryAfterSeconds).toBeGreaterThan(55);
    expect(limiter.check('k', 62_000).blocked).toBe(false);
  });

  it('tracks keys independently and clears on reset', () => {
    const limiter = new LoginLimiter(2, 60_000);
    limiter.recordFailure('a', 0);
    limiter.recordFailure('a', 1);
    expect(limiter.check('a', 2).blocked).toBe(true);
    expect(limiter.check('b', 2).blocked).toBe(false);
    limiter.reset('a');
    expect(limiter.check('a', 3).blocked).toBe(false);
  });
});

describe('user store', () => {
  let directory = '';
  beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'medorch-users-'));
  });
  afterEach(() => rmSync(directory, { recursive: true, force: true }));

  it('creates the three demo users with hashed passwords and writes the plaintext only to the credentials file', async () => {
    const db = openUsersDatabase(path.join(directory, 'users.db'));
    const file = path.join(directory, 'demo_credentials.txt');
    const created = await ensureDemoUsers(db, { credentialsFile: file, env: {} });

    expect(created.map((c) => c.username)).toEqual(['admin', 'doctor', 'billing']);
    const rows = db.prepare('SELECT username, password_hash FROM users').all() as Array<{ username: string; password_hash: string }>;
    expect(rows).toHaveLength(3);
    for (const credential of created) {
      expect(credential.password).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
      expect(JSON.stringify(rows)).not.toContain(credential.password);
    }
    const text = readFileSync(file, 'utf-8');
    for (const credential of created) expect(text).toContain(`${credential.username} | ${credential.password} | ${credential.role}`);
    db.close();
  });

  it('is idempotent: a second run creates nothing and leaves the credentials file alone', async () => {
    const db = openUsersDatabase(path.join(directory, 'users.db'));
    const file = path.join(directory, 'demo_credentials.txt');
    await ensureDemoUsers(db, { credentialsFile: file, env: {} });
    const before = readFileSync(file, 'utf-8');
    expect(await ensureDemoUsers(db, { credentialsFile: file, env: {} })).toEqual([]);
    expect(readFileSync(file, 'utf-8')).toBe(before);
    db.close();
  });

  it('honours a per-role password override from the environment and can skip the credentials file', async () => {
    const db = openUsersDatabase(path.join(directory, 'users.db'));
    const created = await ensureDemoUsers(db, { credentialsFile: null, env: { MEDORCH_DEMO_PASSWORD_ADMIN: 'chosen-by-operator' } });
    expect(created.find((c) => c.username === 'admin')?.password).toBe('chosen-by-operator');
    expect(existsSync(path.join(directory, 'demo_credentials.txt'))).toBe(false);
    expect((await authenticateUser(db, 'admin', 'chosen-by-operator'))?.role).toBe('admin');
    db.close();
  });

  it('authenticates correct credentials only, case-insensitively on the username', async () => {
    const db = openUsersDatabase(path.join(directory, 'users.db'));
    const created = await ensureDemoUsers(db, { credentialsFile: null, env: {} });
    const doctor = created.find((c) => c.username === 'doctor')!;

    expect(await authenticateUser(db, 'doctor', doctor.password)).toEqual({ username: 'doctor', displayName: 'Attending Physician', role: 'doctor' });
    expect((await authenticateUser(db, ' DOCTOR ', doctor.password))?.username).toBe('doctor');
    expect(await authenticateUser(db, 'doctor', 'wrong-password')).toBeNull();
    expect(await authenticateUser(db, 'doctor', created.find((c) => c.username === 'admin')!.password)).toBeNull();
    expect(await authenticateUser(db, 'nobody', doctor.password)).toBeNull();
    expect(await authenticateUser(db, "doctor' OR '1'='1", 'x')).toBeNull();
    db.close();
  });

  it('generates distinct, readable passwords and defines exactly the three roles', () => {
    const passwords = new Set(Array.from({ length: 50 }, () => generatePassword()));
    expect(passwords.size).toBe(50);
    expect(DEMO_USERS.map((u) => u.role)).toEqual(['admin', 'doctor', 'billing']);
  });
});

describe('login, logout and session handlers', () => {
  const make = (overrides: Partial<AuthHandlerDeps> = {}) => {
    const authenticate = vi.fn(async (username: string, password: string) => (username === 'admin' && password === 'right' ? admin : null));
    const deps: AuthHandlerDeps = {
      authenticate,
      secret: () => SECRET,
      now: () => NOW,
      limiter: new LoginLimiter(5, 60_000),
      cookieOptions: () => sessionCookieOptions({ NODE_ENV: 'production' }),
      ...overrides,
    };
    return { deps, authenticate, login: createLoginHandler(deps) };
  };
  const post = (body: unknown, ip = '10.0.0.1') =>
    new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    });

  it('signs the user in with an HttpOnly, SameSite=Lax cookie that verifies, and returns no secrets', async () => {
    const { login } = make();
    const response = await login(post({ username: ' admin ', password: 'right' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: { username: 'admin', displayName: 'Hospital Administrator', role: 'admin' } });
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toContain(`${SESSION_COOKIE}=`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Secure/i);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const token = /medorch_session=([^;]+)/.exec(cookie)![1];
    expect(verifySessionToken(token, SECRET, NOW)).toEqual(admin);
  });

  it('answers a generic 401 for wrong credentials and sets no cookie', async () => {
    const { login } = make();
    const response = await login(post({ username: 'admin', password: 'wrong' }));
    expect(response.status).toBe(401);
    expect((await response.json()).error.message).toBe('Invalid username or password');
    expect(response.headers.get('set-cookie')).toBeNull();
    const unknown = await login(post({ username: 'ghost', password: 'wrong' }));
    expect((await unknown.json()).error.message).toBe('Invalid username or password');
  });

  it('validates input before touching the user store', async () => {
    const { login, authenticate } = make();
    for (const bad of ['not json', {}, { username: 'admin' }, { password: 'x' }, { username: 'a'.repeat(100), password: 'x' }, { username: 5, password: {} }]) {
      expect((await login(post(bad))).status).toBe(400);
    }
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('locks a username out after five failures and stops calling the user store', async () => {
    const { login, authenticate } = make();
    for (let i = 0; i < 5; i++) expect((await login(post({ username: 'admin', password: 'wrong' }, `10.0.0.${i}`))).status).toBe(401);
    const blocked = await login(post({ username: 'admin', password: 'right' }, '10.9.9.9'));
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(authenticate).toHaveBeenCalledTimes(5);
  });

  it('locks an address out too, so rotating usernames does not help', async () => {
    const { login } = make();
    for (let i = 0; i < 5; i++) await login(post({ username: `user${i}`, password: 'wrong' }, '10.5.5.5'));
    expect((await login(post({ username: 'admin', password: 'right' }, '10.5.5.5'))).status).toBe(429);
  });

  it('a successful sign-in clears that username’s failure count', async () => {
    const { login } = make();
    for (let i = 0; i < 4; i++) await login(post({ username: 'admin', password: 'wrong' }, `10.1.1.${i}`));
    expect((await login(post({ username: 'admin', password: 'right' }, '10.2.2.2'))).status).toBe(200);
    expect((await login(post({ username: 'admin', password: 'wrong' }, '10.3.3.3'))).status).toBe(401);
  });

  it('logout expires the cookie and the session endpoint reports who is signed in', async () => {
    const { deps } = make();
    const logout = await createLogoutHandler(deps)();
    expect(logout.headers.get('set-cookie')).toMatch(/medorch_session=;/);
    expect(logout.headers.get('set-cookie')).toMatch(/Max-Age=0/i);

    const session = createSessionHandler(deps);
    const token = createSessionToken(admin, SECRET, NOW);
    const ok = await session(new Request('http://localhost/api/auth/session', { headers: { cookie: `${SESSION_COOKIE}=${token}` } }));
    expect(ok.status).toBe(200);
    expect((await ok.json()).user.role).toBe('admin');
    expect((await session(new Request('http://localhost/api/auth/session'))).status).toBe(401);
    expect((await session(new Request('http://localhost/api/auth/session', { headers: { cookie: `${SESSION_COOKIE}=garbage` } }))).status).toBe(401);
  });
});

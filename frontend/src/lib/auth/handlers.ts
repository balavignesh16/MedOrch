import { NextResponse } from 'next/server';
import { apiError } from '@/lib/apiResponse';
import type { LoginLimiter } from './loginRateLimit';
import { readCookie, SESSION_COOKIE, createSessionToken, verifySessionToken, type SessionUser } from './session';

export interface AuthHandlerDeps {
  authenticate(username: string, password: string): Promise<SessionUser | null>;
  secret(): string;
  now(): number;
  limiter: LoginLimiter;
  cookieOptions(): { httpOnly: boolean; sameSite: 'lax'; secure: boolean; path: string; maxAge: number };
}

const NO_STORE = { 'Cache-Control': 'no-store' };

function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

const publicUser = (user: SessionUser) => ({ username: user.username, displayName: user.displayName, role: user.role });

export function createLoginHandler(deps: AuthHandlerDeps) {
  return async function login(request: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('invalid_json', 'Request body must be valid JSON', 400);
    }
    const record = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
    const username = typeof record.username === 'string' ? record.username.trim() : '';
    const password = typeof record.password === 'string' ? record.password : '';
    if (!username || username.length > 64 || !password || password.length > 200) {
      return apiError('invalid_request', 'Username and password are required', 400);
    }

    const now = deps.now();
    const keys = [`user:${username.toLowerCase()}`, `ip:${clientIp(request)}`];
    const blocked = keys.map((key) => deps.limiter.check(key, now)).find((status) => status.blocked);
    if (blocked) {
      const response = apiError('too_many_attempts', 'Too many failed sign-in attempts. Try again later.', 429);
      response.headers.set('Retry-After', String(blocked.retryAfterSeconds));
      return response;
    }

    const user = await deps.authenticate(username, password);
    if (!user) {
      for (const key of keys) deps.limiter.recordFailure(key, now);
      return apiError('invalid_credentials', 'Invalid username or password', 401);
    }

    deps.limiter.reset(keys[0]);
    const response = NextResponse.json({ user: publicUser(user) }, { headers: NO_STORE });
    response.cookies.set({ name: SESSION_COOKIE, value: createSessionToken(user, deps.secret(), now), ...deps.cookieOptions() });
    return response;
  };
}

export function createLogoutHandler(deps: Pick<AuthHandlerDeps, 'cookieOptions'>) {
  return async function logout(): Promise<Response> {
    const response = NextResponse.json({ ok: true }, { headers: NO_STORE });
    response.cookies.set({ name: SESSION_COOKIE, value: '', ...deps.cookieOptions(), maxAge: 0 });
    return response;
  };
}

export function createSessionHandler(deps: Pick<AuthHandlerDeps, 'secret' | 'now'>) {
  return async function session(request: Request): Promise<Response> {
    const user = verifySessionToken(readCookie(request.headers.get('cookie'), SESSION_COOKIE), deps.secret(), deps.now());
    if (!user) return apiError('unauthorized', 'Not signed in', 401);
    return NextResponse.json({ user: publicUser(user) }, { headers: NO_STORE });
  };
}

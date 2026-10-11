import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Role } from '@/lib/navigation';

export const SESSION_COOKIE = 'medorch_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface SessionUser {
  username: string;
  displayName: string;
  role: Role;
}

const ROLES: readonly string[] = ['admin', 'doctor', 'billing'];
const DEV_SECRET = 'medorch-development-only-secret-do-not-use-in-production';
let warnedAboutDevSecret = false;

/** In production a real SESSION_SECRET is mandatory; in development a fixed fallback keeps sessions across restarts. */
export function getSessionSecret(env: Record<string, string | undefined> = process.env): string {
  const configured = env.SESSION_SECRET?.trim();
  const production = env.NODE_ENV === 'production';
  if (configured) {
    if (production && configured.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters in production');
    return configured;
  }
  if (production) throw new Error('SESSION_SECRET must be set in production');
  if (!warnedAboutDevSecret) {
    warnedAboutDevSecret = true;
    console.warn('SESSION_SECRET is not set; using an insecure development-only secret. Set it before deploying.');
  }
  return DEV_SECRET;
}

const toBase64Url = (buffer: Buffer) => buffer.toString('base64url');

function sign(payloadPart: string, secret: string): string {
  return toBase64Url(createHmac('sha256', secret).update(payloadPart).digest());
}

export function createSessionToken(user: SessionUser, secret: string, nowMs: number, ttlSeconds = SESSION_TTL_SECONDS): string {
  const payload = {
    u: user.username,
    n: user.displayName,
    r: user.role,
    exp: Math.floor(nowMs / 1000) + ttlSeconds,
  };
  const payloadPart = toBase64Url(Buffer.from(JSON.stringify(payload), 'utf-8'));
  return `${payloadPart}.${sign(payloadPart, secret)}`;
}

export function verifySessionToken(token: string | null | undefined, secret: string, nowMs: number): SessionUser | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadPart, signaturePart] = parts;

  const expected = Buffer.from(sign(payloadPart, secret));
  const actual = Buffer.from(signaturePart);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8')) as {
      u?: unknown; n?: unknown; r?: unknown; exp?: unknown;
    };
    if (typeof payload.u !== 'string' || typeof payload.n !== 'string' || typeof payload.r !== 'string' || typeof payload.exp !== 'number') return null;
    if (!ROLES.includes(payload.r)) return null;
    if (payload.exp <= Math.floor(nowMs / 1000)) return null;
    return { username: payload.u, displayName: payload.n, role: payload.r as Role };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(env: Record<string, string | undefined> = process.env) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production' && env.MEDORCH_INSECURE_COOKIES !== 'true',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function readCookie(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return undefined;
}

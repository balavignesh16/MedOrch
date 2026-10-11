import { apiError } from '@/lib/apiResponse';
import type { Role } from '@/lib/navigation';
import { canAccess } from './access';
import { getSessionSecret, readCookie, SESSION_COOKIE, verifySessionToken, type SessionUser } from './session';

/** The signed-in user for a request, or null. Role information always comes from the signed cookie, never from the client. */
export function getSessionUser(request: Request): SessionUser | null {
  return verifySessionToken(readCookie(request.headers.get('cookie'), SESSION_COOKIE), getSessionSecret(), Date.now());
}

export type GuardResult = { ok: true; user: SessionUser } | { ok: false; response: Response };

/** Defense in depth for API handlers: the proxy already blocks unauthenticated requests, but handlers check too. */
export function requireSession(request: Request, roles?: Role[]): GuardResult {
  const user = getSessionUser(request);
  if (!user) return { ok: false, response: apiError('unauthorized', 'Sign in to use this endpoint', 401) };
  const permitted = roles ? roles.includes(user.role) : canAccess(user.role, new URL(request.url).pathname);
  if (!permitted) return { ok: false, response: apiError('forbidden', 'Your role cannot use this endpoint', 403) };
  return { ok: true, user };
}

import { NAV_LINKS, type Role } from '@/lib/navigation';

export const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/session'];

/** API areas restricted to particular roles; every other API route needs a session but any role. */
const API_ROLE_RULES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: '/api/patients', roles: ['admin', 'doctor'] },
];

export type AccessDecision =
  | { action: 'allow' }
  | { action: 'redirect'; to: string }
  | { action: 'unauthorized' }
  | { action: 'forbidden'; api: boolean };

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Roles allowed to view a page, from the same navigation table the sidebar uses; null means any signed-in role. */
export function rolesForPage(pathname: string): Role[] | null {
  let best: { href: string; roles: Role[] } | null = null;
  for (const link of NAV_LINKS) {
    if (link.href === '/') continue;
    if (matchesPrefix(pathname, link.href) && (!best || link.href.length > best.href.length)) {
      best = { href: link.href, roles: link.roles };
    }
  }
  return best ? best.roles : null;
}

export function canAccess(role: Role, pathname: string): boolean {
  if (pathname.startsWith('/api/')) {
    const rule = API_ROLE_RULES.find((entry) => matchesPrefix(pathname, entry.prefix));
    return rule ? rule.roles.includes(role) : true;
  }
  const roles = rolesForPage(pathname);
  return roles === null || roles.includes(role);
}

/** Only same-site relative paths are accepted as post-login destinations (prevents open redirects). */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\') || raw.includes('://')) return '/';
  if (raw.startsWith('/login')) return '/';
  return raw;
}

export function decideAccess(pathname: string, search: string, user: { role: Role } | null): AccessDecision {
  const isApi = pathname.startsWith('/api/');
  if (isPublicPath(pathname)) {
    if (pathname === '/login' && user) return { action: 'redirect', to: '/' };
    return { action: 'allow' };
  }
  if (!user) {
    if (isApi) return { action: 'unauthorized' };
    const next = encodeURIComponent(`${pathname}${search}`);
    return { action: 'redirect', to: `/login?next=${next}` };
  }
  if (!canAccess(user.role, pathname)) return { action: 'forbidden', api: isApi };
  return { action: 'allow' };
}

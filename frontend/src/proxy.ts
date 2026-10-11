import { NextResponse, type NextRequest } from 'next/server';
import { decideAccess } from '@/lib/auth/access';
import { getSessionSecret, SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';

/** Runs before every page and API request: no valid signed session means no access, and roles are enforced here and again in API handlers. */
export function proxy(request: NextRequest) {
  const user = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, getSessionSecret(), Date.now());
  const { pathname, search } = request.nextUrl;
  const decision = decideAccess(pathname, search, user);

  switch (decision.action) {
    case 'redirect':
      return NextResponse.redirect(new URL(decision.to, request.url));
    case 'unauthorized':
      return NextResponse.json({ error: { code: 'unauthorized', message: 'Sign in to use this endpoint' } }, { status: 401 });
    case 'forbidden':
      return decision.api
        ? NextResponse.json({ error: { code: 'forbidden', message: 'Your role cannot use this endpoint' } }, { status: 403 })
        : NextResponse.redirect(new URL(`/forbidden?path=${encodeURIComponent(pathname)}`, request.url));
    default:
      return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|css|js|map)$).*)'],
};

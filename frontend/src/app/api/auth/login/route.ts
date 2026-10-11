import { createLoginHandler } from '@/lib/auth/handlers';
import { LoginLimiter } from '@/lib/auth/loginRateLimit';
import { getSessionSecret, sessionCookieOptions } from '@/lib/auth/session';
import { authenticateUser, getUsersDatabase } from '@/lib/auth/users';

export const dynamic = 'force-dynamic';

const limiter = new LoginLimiter();

export const POST = createLoginHandler({
  authenticate: async (username, password) => authenticateUser(await getUsersDatabase(), username, password),
  secret: () => getSessionSecret(),
  now: () => Date.now(),
  limiter,
  cookieOptions: () => sessionCookieOptions(),
});

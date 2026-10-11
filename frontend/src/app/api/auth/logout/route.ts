import { createLogoutHandler } from '@/lib/auth/handlers';
import { sessionCookieOptions } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const POST = createLogoutHandler({ cookieOptions: () => sessionCookieOptions() });

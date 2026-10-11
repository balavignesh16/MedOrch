import { createSessionHandler } from '@/lib/auth/handlers';
import { getSessionSecret } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const GET = createSessionHandler({ secret: () => getSessionSecret(), now: () => Date.now() });

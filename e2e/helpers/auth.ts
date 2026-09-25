import type { BrowserContext } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { db } from './db';

/** Name of the Auth.js session cookie over plain http; Auth.js also uses it as the JWT salt. */
export const SESSION_COOKIE = 'authjs.session-token';

/**
 * Signs a user in without Google (REQ-124): upserts the `User` row and sets an Auth.js JWT session cookie encrypted
 * with the app's AUTH_SECRET (from .env.test through `npm run test:e2e`). The token has no `pwdAt`, like a Google
 * session.
 */
export async function signInAs(
  context: BrowserContext,
  user: { email: string; name: string },
): Promise<{ id: string }> {
  const secret = process.env.AUTH_SECRET;
  if (!secret)
    throw new Error('AUTH_SECRET is not set: run E2E with npm run test:e2e (it loads .env.test)');
  const u = await db.user.upsert({ where: { email: user.email }, update: {}, create: user });
  const maxAge = 24 * 60 * 60;
  const value = await encode({
    token: { sub: u.id, name: user.name, email: user.email },
    secret,
    salt: SESSION_COOKIE,
    maxAge,
  });
  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + maxAge,
    },
  ]);
  return { id: u.id };
}

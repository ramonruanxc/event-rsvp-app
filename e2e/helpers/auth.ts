import type { BrowserContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { db } from './db';

/**
 * Signs a user in by inserting an Auth.js database session and setting its cookie.
 *
 * E2E tests never go through Google: this upserts a `User` row, creates a matching
 * `Session` row, and adds the `authjs.session-token` cookie to the browser context so
 * the app resolves it exactly as it would a real Google sign-in (database sessions).
 */
export async function signInAs(
  context: BrowserContext,
  user: { email: string; name: string },
): Promise<{ id: string }> {
  const u = await db.user.upsert({ where: { email: user.email }, update: {}, create: user });
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.session.create({ data: { sessionToken, userId: u.id, expires } });
  await context.addCookies([
    {
      name: 'authjs.session-token',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(expires.getTime() / 1000),
    },
  ]);
  return { id: u.id };
}

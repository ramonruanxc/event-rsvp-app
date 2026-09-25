import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { SESSION_COOKIE, signInAs } from './helpers/auth';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-124: JWT sessions', () => {
  test('REQ-124: a cookie from the old database sessions just means signed out', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: SESSION_COOKIE,
        value: randomUUID(),
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    const response = await page.goto('/en');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('banner').getByLabel('Account menu')).toHaveCount(0);
  });

  test('REQ-124: signing out clears the session cookie', async ({ page, context }) => {
    await signInAs(context, { email: 'ana@example.com', name: 'Ana' });
    await page.goto('/en');
    const banner = page.getByRole('banner');
    await banner.getByLabel('Account menu').click();
    await banner.getByRole('button', { name: 'Sign out' }).click();
    await expect(banner.getByLabel('Account menu')).toHaveCount(0);
    expect((await context.cookies()).some((c) => c.name === SESSION_COOKIE)).toBe(false);
  });
});

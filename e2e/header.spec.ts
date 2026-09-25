import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-80: header language, theme and account', () => {
  test('REQ-80: signed out, the header adapts from desktop to a 375 px phone', async ({ page }) => {
    await page.goto('/en');
    const banner = page.getByRole('banner');

    const signIn = banner.getByRole('link', { name: 'Sign in', exact: true });
    await expect(signIn).toBeVisible();
    await expect(signIn).toHaveAttribute('href', '/en/sign-in?callbackUrl=%2Fen%2Fdashboard');
    const wideBox = await page.getByLabel('Language').boundingBox();
    expect(wideBox!.width).toBeGreaterThan(40);

    await page.setViewportSize({ width: 375, height: 740 });
    await expect(banner.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
    const phoneBox = await page.getByLabel('Language').boundingBox();
    expect(phoneBox!.width).toBe(40);
  });

  test('REQ-80: a signed-in organizer reaches My events and Sign out from the account menu', async ({
    page,
    context,
  }) => {
    await signInAs(context, { email: 'ana@example.com', name: 'Ana' });
    await page.goto('/en');
    const banner = page.getByRole('banner');

    const summary = banner.getByLabel('Account menu');
    await expect(summary).toBeVisible();
    await expect(summary).toHaveText('A');

    await summary.click();
    await expect(banner.getByText('Signed in as Ana')).toBeVisible();
    await expect(banner.getByRole('link', { name: 'My events' })).toBeVisible();
    await expect(banner.getByRole('link', { name: 'Account', exact: true })).toHaveAttribute(
      'href',
      '/en/account',
    );
    await expect(banner.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
});

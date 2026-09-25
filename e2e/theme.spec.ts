import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-62/REQ-63: theme rendered from the cookie', () => {
  test('REQ-62: a first visit renders the dark theme', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('REQ-63: the stored theme is already in the server HTML', async ({ page, context }) => {
    await context.addCookies([{ name: 'theme', value: 'light', domain: 'localhost', path: '/' }]);
    const res = await page.goto('/en');
    expect(await res!.text()).toMatch(/<html[^>]*\sdata-theme="light"/);

    await context.addCookies([{ name: 'theme', value: 'purple', domain: 'localhost', path: '/' }]);
    const res2 = await page.goto('/en');
    expect(await res2!.text()).toMatch(/<html[^>]*\sdata-theme="dark"/);
  });
});

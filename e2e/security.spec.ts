import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { createOwner, createEvent } from './helpers/factories';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-60: security headers', () => {
  test('REQ-60: pages are served with the security headers', async ({ page }) => {
    const res = await page.goto('/en');

    expect(res!.headers()['x-frame-options']).toBe('DENY');
    expect(res!.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res!.headers()['x-content-type-options']).toBe('nosniff');
  });
});

test.describe('REQ-61: user content renders as text', () => {
  test('REQ-61: an HTML description is shown literally and never executed', async ({ page }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id, {
      description: '<img src=x onerror="window.__xss=1">',
    });

    await page.goto(`/en/e/${event.slug}`);

    await expect(page.getByText('<img src=x onerror="window.__xss=1">')).toBeVisible();
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();
  });
});

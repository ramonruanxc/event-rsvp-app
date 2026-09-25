import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';

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

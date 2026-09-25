import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-76: the favicon is the logo', () => {
  test('REQ-76: the page head links the SVG favicon', async ({ page }) => {
    await page.goto('/en');

    const icon = page.locator('link[rel="icon"][type="image/svg+xml"]');
    await expect(icon).toHaveCount(1);
    const href = await icon.getAttribute('href');
    expect(href).toMatch(/^\/icon\.svg/);

    const response = await page.request.get(href!);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('#3630B0');
    expect(body).toContain('#3BDBD1');

    await expect(page.locator('link[rel="icon"][href*="favicon.ico"]')).toHaveCount(0);
  });
});

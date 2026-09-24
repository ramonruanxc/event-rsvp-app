import { test, expect } from '@playwright/test';

test.describe('REQ-53: locale detection from the browser', () => {
  test.describe('French browser', () => {
    test.use({ locale: 'fr-FR' });

    test('REQ-53: a French browser opening / lands on /fr', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/fr$/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    });
  });

  test.describe('Brazilian Portuguese browser', () => {
    test.use({ locale: 'pt-BR' });

    test('REQ-53: a Brazilian Portuguese browser lands on /pt-BR', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/pt-BR$/);
    });
  });

  test.describe('unsupported browser language', () => {
    test.use({ locale: 'de-DE' });

    test('REQ-53: an unsupported browser language falls back to /en', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/en$/);
    });
  });
});

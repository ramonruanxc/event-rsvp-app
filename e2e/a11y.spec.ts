import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-66: visible focus indicator', () => {
  test('REQ-66: the first Tab on the home page shows a 2 px solid focus ring', async ({ page }) => {
    await page.goto('/en');
    await page.keyboard.press('Tab');

    const outline = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement as Element);
      return { style: s.outlineStyle, width: s.outlineWidth };
    });

    expect(outline).toEqual({ style: 'solid', width: '2px' });
  });
});

import { test, expect } from '@playwright/test';
import { db, resetDatabase } from './helpers/db';

test.beforeEach(async () => {
  await resetDatabase();
});

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

test.describe('REQ-54: switching the language', () => {
  test('REQ-54: switching to French on an event page keeps the page and remembers the choice', async ({
    page,
  }) => {
    const owner = await db.user.create({ data: { email: 'owner@example.com', name: 'Owner' } });
    const event = await db.event.create({
      data: {
        slug: 'evt-fr-0001',
        ownerId: owner.id,
        name: 'Team dinner',
        description: 'Pasta night',
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        timezone: 'America/New_York',
      },
    });

    await page.goto(`/en/e/${event.slug}`);
    await page.getByLabel('Language').selectOption('fr');

    await expect(page).toHaveURL(new RegExp(`/fr/e/${event.slug}$`));
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('heading', { name: 'Team dinner' })).toBeVisible();

    await page.goto('/');
    await expect(page).toHaveURL(/\/fr$/);
  });
});

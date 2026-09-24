import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { createOwner, createEvent } from './helpers/factories';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-38: the invite link opens in the guest language', () => {
  test.use({ locale: 'fr-FR' });

  test('REQ-38: an invite link without locale redirects to the browser language', async ({
    page,
  }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);

    await page.goto(`/e/${event.slug}`);

    await expect(page).toHaveURL(new RegExp(`/fr/e/${event.slug}$`));
  });
});

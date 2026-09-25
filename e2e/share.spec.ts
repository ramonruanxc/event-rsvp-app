import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { createOwner, createEvent } from './helpers/factories';
import { signInAs } from './helpers/auth';

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

test.describe('REQ-42: add to calendar link', () => {
  test('REQ-42: guest and owner pages link to the calendar file', async ({ page, context }) => {
    const email = 'owner-cal@example.com';
    const owner = await createOwner(email);
    const event = await createEvent(owner.id);

    await page.goto(`/en/e/${event.slug}`);
    const guestLink = page.getByRole('link', { name: 'Add to calendar' });
    await expect(guestLink).toHaveAttribute('href', `/e/${event.slug}/calendar.ics`);
    const guestRes = await page.request.get(`/e/${event.slug}/calendar.ics`);
    expect(guestRes.status()).toBe(200);

    await signInAs(context, { email, name: 'OwnerCal' });
    await page.goto(`/en/e/${event.slug}`);
    const ownerLink = page.getByRole('link', { name: 'Add to calendar' });
    await expect(ownerLink).toHaveAttribute('href', `/e/${event.slug}/calendar.ics`);
    const ownerRes = await page.request.get(`/e/${event.slug}/calendar.ics`);
    expect(ownerRes.status()).toBe(200);
  });
});

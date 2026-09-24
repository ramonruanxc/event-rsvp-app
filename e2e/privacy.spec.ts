import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';
import { createOwner, createEvent, createRsvp } from './helpers/factories';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-33: guest names never reach non-owners', () => {
  test("REQ-33: a guest's page HTML contains no other guest names", async ({ page }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);
    await createRsvp(event.id, 'Maria', 'GOING', 3);
    await createRsvp(event.id, 'João', 'NOT_GOING');

    await page.goto(`/en/e/${event.slug}`);

    const html = await page.content();
    expect(html).not.toContain('Maria');
    expect(html).not.toContain('João');
    expect(html).toContain('3 people going');
  });

  test('REQ-33: a signed-in non-owner gets the guest view too', async ({ page, context }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);
    await createRsvp(event.id, 'Maria', 'GOING', 3);
    await createRsvp(event.id, 'João', 'NOT_GOING');
    await signInAs(context, { email: 'other@example.com', name: 'Other' });

    await page.goto(`/en/e/${event.slug}`);

    const html = await page.content();
    expect(html).not.toContain('Maria');
    expect(html).not.toContain('João');
    expect(html).toContain('3 people going');
  });

  test("REQ-33: the owner's HTML contains the names", async ({ page, context }) => {
    const { id: ownerId } = await signInAs(context, {
      email: 'privacy-owner@example.com',
      name: 'Owner',
    });
    const event = await createEvent(ownerId);
    await createRsvp(event.id, 'Maria', 'GOING', 3);
    await createRsvp(event.id, 'João', 'NOT_GOING');

    await page.goto(`/en/e/${event.slug}`);

    const html = await page.content();
    expect(html).toContain('Maria');
    expect(html).toContain('João');
  });
});

import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';
import { createEvent, createRsvp } from './helpers/factories';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-34: the owner guest list', () => {
  test('REQ-34: the owner sees every RSVP with totals', async ({ page, context }) => {
    const { id: ownerId } = await signInAs(context, {
      email: 'owner1@example.com',
      name: 'Owner',
    });
    const event = await createEvent(ownerId);
    await createRsvp(event.id, 'Maria', 'GOING', 3);
    await createRsvp(event.id, 'João', 'NOT_GOING');

    await page.goto(`/en/e/${event.slug}`);

    await expect(page.getByText('1 going · 1 declined · 3 people')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Response' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'People' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Last updated' })).toBeVisible();

    const mariaRow = page.getByRole('row', { name: /Maria/ });
    await expect(mariaRow).toContainText('Going');
    await expect(mariaRow).toContainText('3');

    const joaoRow = page.getByRole('row', { name: /João/ });
    await expect(joaoRow).toContainText('Not going');
    await expect(joaoRow).toContainText('0');

    await expect(page.getByRole('button', { name: 'Send RSVP' })).toHaveCount(0);
  });

  test('REQ-34: an event without RSVPs says so', async ({ page, context }) => {
    const { id: ownerId } = await signInAs(context, {
      email: 'owner2@example.com',
      name: 'Owner2',
    });
    const event = await createEvent(ownerId);

    await page.goto(`/en/e/${event.slug}`);

    await expect(page.getByText('No RSVPs yet.')).toBeVisible();
  });
});

test.describe('REQ-30: the owner removes an RSVP', () => {
  test('REQ-30: the owner removes an RSVP', async ({ page, context }) => {
    const { id: ownerId } = await signInAs(context, {
      email: 'owner3@example.com',
      name: 'Owner3',
    });
    const event = await createEvent(ownerId);
    await createRsvp(event.id, 'Maria', 'GOING', 3);
    await createRsvp(event.id, 'João', 'NOT_GOING');

    await page.goto(`/en/e/${event.slug}`);
    await page.getByRole('row', { name: /Maria/ }).getByRole('button', { name: 'Remove' }).click();
    await page
      .getByRole('row', { name: /Maria/ })
      .getByRole('button', { name: 'Remove', exact: true })
      .click();

    await expect(page.getByText('Maria')).toHaveCount(0);
    await expect(page.getByText('0 going · 1 declined · 0 people')).toBeVisible();
  });
});

test.describe('REQ-34: an ended event', () => {
  test('REQ-34: after the event ended the owner still sees the list and can remove', async ({
    page,
    context,
  }) => {
    const { id: ownerId } = await signInAs(context, {
      email: 'owner4@example.com',
      name: 'Owner4',
    });
    const event = await createEvent(ownerId, { startsAt: new Date('2020-01-01T19:00:00Z') });
    await createRsvp(event.id, 'Maria', 'GOING', 3);

    await page.goto(`/en/e/${event.slug}`);

    await expect(page.getByText('Maria')).toBeVisible();
    await page.getByRole('button', { name: 'Remove' }).click();
    await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(page.getByText('Maria')).toHaveCount(0);

    await expect(page.getByRole('button', { name: 'Delete event' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Edit' })).toHaveCount(0);
  });
});

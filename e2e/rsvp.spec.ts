import { test, expect } from '@playwright/test';
import { resetDatabase, db } from './helpers/db';
import { createOwner, createEvent } from './helpers/factories';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-23: a guest submits an RSVP', () => {
  test('REQ-23: a guest without an account RSVPs and sees the confirmation', async ({ page }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);

    await page.goto(`/en/e/${event.slug}`);
    await page.getByLabel('Your name').fill('Maria');
    await page.getByLabel('How many people, including you?').fill('3');
    await page.getByRole('button', { name: 'Send RSVP' }).click();

    await expect(page.getByText("You're going · 3 people")).toBeVisible();
    expect(await db.rsvp.count()).toBe(1);
  });
});

test.describe('REQ-24: the edit-token cookie', () => {
  test('REQ-24: the edit cookie is httpOnly, Lax and scoped to the event path', async ({
    page,
    context,
  }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);

    await page.goto(`/en/e/${event.slug}`);
    await page.getByLabel('Your name').fill('Maria');
    await page.getByLabel('How many people, including you?').fill('3');
    await page.getByRole('button', { name: 'Send RSVP' }).click();
    await expect(page.getByText("You're going · 3 people")).toBeVisible();

    const cookie = (await context.cookies()).find((c) => c.name === 'rsvp_edit_en');
    expect(cookie?.path).toBe(`/en/e/${event.slug}`);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('Lax');
  });
});

test.describe('REQ-31: a returning guest', () => {
  test('REQ-31: a returning guest sees their RSVP instead of a blank form', async ({ page }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);

    await page.goto(`/en/e/${event.slug}`);
    await page.getByLabel('Your name').fill('Maria');
    await page.getByLabel('How many people, including you?').fill('3');
    await page.getByRole('button', { name: 'Send RSVP' }).click();
    await expect(page.getByText("You're going · 3 people")).toBeVisible();

    await page.reload();

    await expect(page.getByText("You're going · 3 people")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send RSVP' })).toHaveCount(0);
  });

  test('REQ-31: change and cancel', async ({ page }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);

    await page.goto(`/en/e/${event.slug}`);
    await page.getByLabel('Your name').fill('Maria');
    await page.getByLabel('How many people, including you?').fill('3');
    await page.getByRole('button', { name: 'Send RSVP' }).click();
    await expect(page.getByText("You're going · 3 people")).toBeVisible();

    await page.getByRole('button', { name: 'Change' }).click();
    await page.getByLabel('How many people, including you?').fill('5');
    await page.getByRole('button', { name: 'Send RSVP' }).click();
    await expect(page.getByText("You're going · 5 people")).toBeVisible();

    await page.getByRole('button', { name: 'Cancel RSVP' }).click();
    await expect(page.getByText("You're not going")).toBeVisible();

    const rsvp = await db.rsvp.findFirst();
    expect(rsvp?.status).toBe('NOT_GOING');
    expect(rsvp?.partySize).toBe(0);
  });
});

test.describe('REQ-31: French UI', () => {
  test('REQ-31: French UI keeps the event content as entered', async ({ page }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id, { name: 'Team dinner' });

    await page.goto(`/fr/e/${event.slug}`);

    await expect(page.getByLabel('Combien de personnes, vous compris ?')).toBeVisible();
    await expect(page.getByText('Team dinner')).toBeVisible();
  });
});

test.describe('REQ-26: a duplicate name from another browser', () => {
  test('REQ-26: a second browser cannot take a name already on the list', async ({
    page,
    browser,
  }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);

    await page.goto(`/en/e/${event.slug}`);
    await page.getByLabel('Your name').fill('Maria');
    await page.getByLabel('How many people, including you?').fill('3');
    await page.getByRole('button', { name: 'Send RSVP' }).click();
    await expect(page.getByText("You're going · 3 people")).toBeVisible();

    const b = await browser.newContext();
    const pageB = await b.newPage();
    await pageB.goto(`/en/e/${event.slug}`);
    await pageB.getByLabel('Your name').fill('maria');
    await pageB.getByLabel('How many people, including you?').fill('2');
    await pageB.getByRole('button', { name: 'Send RSVP' }).click();

    await expect(
      pageB.getByText(
        'This name is already on the list. Use a different name or ask the organizer.',
      ),
    ).toBeVisible();
    await expect(pageB.getByLabel('Your name')).toHaveValue('maria');
    expect(await db.rsvp.count()).toBe(1);

    await b.close();
  });
});

test.describe('REQ-29: the guest page of an ended event', () => {
  test('REQ-29: the guest page of an ended event is read-only', async ({ page }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id, {
      startsAt: new Date('2020-01-01T19:00:00Z'),
    });

    await page.goto(`/en/e/${event.slug}`);

    await expect(page.getByText('This event has ended')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send RSVP' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Change' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cancel RSVP' })).toHaveCount(0);
  });
});

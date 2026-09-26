import { test, expect, type Locator } from '@playwright/test';
import { db, resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';
import { futureDate } from './helpers/dates';
import { createEvent, createOwner } from './helpers/factories';

test.beforeEach(async () => {
  await resetDatabase();
});

/** True while the input's native picker is open (the `:open` pseudo-class, Chromium 133+). */
async function pickerIsOpen(input: Locator): Promise<boolean> {
  return input.evaluate((el) => el.matches(':open'));
}

test.describe('REQ-159: core journeys on a 375 px phone', () => {
  test('REQ-159: the phone project is 375 px wide', async ({ page }) => {
    await page.goto('/en');
    expect(page.viewportSize()).toEqual({ width: 375, height: 812 });
  });

  test('REQ-159: a guest RSVPs by tapping', async ({ page }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);

    await page.goto(`/en/e/${event.slug}`);
    await page.getByLabel('Your name').fill('Maria');
    await page.getByRole('button', { name: 'One more person' }).tap();
    await page.getByRole('button', { name: 'Send RSVP' }).tap();

    await expect(page.getByText("You're going · 2 people")).toBeVisible();
    expect((await db.rsvp.findFirst())?.partySize).toBe(2);
  });

  test('REQ-159: an organizer creates an event by tapping', async ({ page, context }) => {
    await signInAs(context, { email: 'phone@example.com', name: 'Phone' });

    await page.goto('/en/events/new');
    await page.getByLabel('Name').fill('Team dinner');
    await page.getByLabel('Description').fill('Pasta night');
    await page.getByLabel('Date').fill(futureDate(7));
    await page.getByLabel('Time', { exact: true }).fill('19:00');
    await page.getByRole('button', { name: 'Save event' }).tap();

    await expect(page).toHaveURL(/\/en\/e\/[A-Za-z0-9_-]{10}$/);
    await expect(page.getByRole('heading', { name: 'Team dinner' })).toBeVisible();
    await expect(page.getByLabel('Invite link')).toBeVisible();
  });
});

test.describe('REQ-131: the native date and time pickers really open', () => {
  test('REQ-131: tapping the Date field opens its picker', async ({ page, context }) => {
    await signInAs(context, { email: 'picker1@example.com', name: 'Picker' });
    await page.goto('/en/events/new');
    const date = page.locator('#date');
    expect(await pickerIsOpen(date)).toBe(false);

    await date.tap();

    await expect.poll(() => pickerIsOpen(date)).toBe(true);
    await page.keyboard.press('Escape');
    await expect.poll(() => pickerIsOpen(date)).toBe(false);
  });

  test('REQ-131: tapping "Open time picker" focuses Time and opens its picker', async ({
    page,
    context,
  }) => {
    await signInAs(context, { email: 'picker2@example.com', name: 'Picker' });
    await page.goto('/en/events/new');
    const time = page.locator('#time');

    await page.getByRole('button', { name: 'Open time picker' }).tap();

    await expect(time).toBeFocused();
    await expect.poll(() => pickerIsOpen(time)).toBe(true);
  });
});

test.describe('REQ-137: errors on a phone are brought into view', () => {
  test('REQ-137: an empty new-event form focuses Name inside the viewport', async ({
    page,
    context,
  }) => {
    await signInAs(context, { email: 'phone-form@example.com', name: 'Phone' });
    await page.goto('/en/events/new');

    await page.getByRole('button', { name: 'Save event' }).tap();

    const name = page.getByLabel('Name', { exact: true });
    await expect(name).toBeFocused();
    await expect(name).toBeInViewport();
  });
});

test.describe('REQ-150, REQ-151: the event page on a phone', () => {
  test('REQ-150: the French invite link field is readable, with the button under it', async ({
    page,
    context,
  }) => {
    const { id } = await signInAs(context, { email: 'phone-owner@example.com', name: 'Owner' });
    const event = await createEvent(id);

    await page.goto(`/fr/e/${event.slug}`);

    const field = page.getByLabel("Lien d'invitation");
    await expect(field).toHaveValue(/\/e\//);
    const fieldBox = (await field.boundingBox())!;
    const buttonBox = (await page
      .getByRole('button', { name: "Copier le lien d'invitation" })
      .boundingBox())!;
    expect(fieldBox.width).toBeGreaterThanOrEqual(250);
    expect(buttonBox.y).toBeGreaterThanOrEqual(fieldBox.y + fieldBox.height);
  });

  test('REQ-151: the time and its zone stay on one line', async ({ page }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id, { timezone: 'America/Sao_Paulo' });

    await page.goto(`/en/e/${event.slug}`);

    const time = page.locator('.ev-time');
    await expect(time).toHaveText(/GMT-3$/);
    expect(await time.evaluate((el) => el.getClientRects().length)).toBe(1);
  });
});

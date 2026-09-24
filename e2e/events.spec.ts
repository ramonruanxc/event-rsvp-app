import { test, expect } from '@playwright/test';
import { resetDatabase, db } from './helpers/db';
import { signInAs } from './helpers/auth';
import { futureDate } from './helpers/dates';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-15: an organizer creates an event', () => {
  test('REQ-15: an organizer creates an event and lands on its page', async ({ page, context }) => {
    await signInAs(context, { email: 'ana@example.com', name: 'Ana' });

    await page.goto('/en/events/new');
    await page.getByLabel('Name').fill('Team dinner');
    await page.getByLabel('Description').fill('Pasta night');
    await page.getByLabel('Date').fill(futureDate(7));
    await page.getByLabel('Time', { exact: true }).fill('19:00');
    await page.getByLabel('Location (optional)').fill("Mario's");
    await page.getByRole('button', { name: 'Save event' }).click();

    await expect(page).toHaveURL(/\/en\/e\/[A-Za-z0-9_-]{10}$/);
    await expect(page.getByRole('heading', { name: 'Team dinner' })).toBeVisible();
    await expect(page.getByText('Pasta night')).toBeVisible();
    await expect(page.getByText("Mario's")).toBeVisible();
  });

  test('REQ-15: an empty name shows an error and creates nothing', async ({ page, context }) => {
    await signInAs(context, { email: 'ana2@example.com', name: 'Ana' });

    await page.goto('/en/events/new');
    await page.getByLabel('Description').fill('Pasta night');
    await page.getByLabel('Date').fill(futureDate(7));
    await page.getByLabel('Time', { exact: true }).fill('19:00');
    await page.getByRole('button', { name: 'Save event' }).click();

    await expect(page.getByText('This field is required.')).toBeVisible();
    expect(await db.event.count()).toBe(0);
  });
});

test.describe('REQ-13: timezone prefill', () => {
  test.use({ timezoneId: 'America/Sao_Paulo' });

  test('REQ-13: the timezone is prefilled from the browser and can be changed', async ({
    page,
    context,
  }) => {
    await signInAs(context, { email: 'tz@example.com', name: 'TZ' });

    await page.goto('/en/events/new');
    await expect(page.getByLabel('Timezone')).toHaveValue('America/Sao_Paulo');

    await page.getByLabel('Name').fill('Team dinner');
    await page.getByLabel('Description').fill('Pasta night');
    await page.getByLabel('Date').fill(futureDate(7));
    await page.getByLabel('Time', { exact: true }).fill('19:00');
    await page.getByLabel('Timezone').selectOption('Europe/Paris');
    await page.getByRole('button', { name: 'Save event' }).click();

    await expect(page).toHaveURL(/\/en\/e\/[A-Za-z0-9_-]{10}$/);
    const event = await db.event.findFirst();
    expect(event?.timezone).toBe('Europe/Paris');
  });
});

test.describe('REQ-18: deleting an event', () => {
  test('REQ-18: the owner deletes an event', async ({ page, context }) => {
    const { id: ownerId } = await signInAs(context, { email: 'del@example.com', name: 'Del' });
    const event = await db.event.create({
      data: {
        slug: 'evt-delete01',
        ownerId,
        name: 'Team dinner',
        description: 'Pasta night',
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        timezone: 'America/New_York',
      },
    });

    await page.goto(`/en/e/${event.slug}`);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete event' }).click();

    await expect(page).toHaveURL(/\/en\/dashboard$/);
    expect(await db.event.count()).toBe(0);
  });
});

import { test, expect } from '@playwright/test';
import { fromZonedTime } from 'date-fns-tz';
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

test.describe('REQ-17: editing an event', () => {
  test('REQ-17: the owner edits an event from a prefilled form', async ({ page, context }) => {
    const { id: ownerId } = await signInAs(context, { email: 'edit@example.com', name: 'Editor' });
    const event = await db.event.create({
      data: {
        slug: 'evt-edit0001',
        ownerId,
        name: 'Team dinner',
        description: 'Pasta night',
        startsAt: fromZonedTime(`${futureDate(7)}T19:00:00`, 'America/New_York'),
        timezone: 'America/New_York',
      },
    });

    await page.goto(`/en/e/${event.slug}/edit`);
    await expect(page.getByLabel('Name')).toHaveValue('Team dinner');
    await expect(page.getByLabel('Time', { exact: true })).toHaveValue('19:00');
    await expect(page.getByLabel('Timezone')).toHaveValue('America/New_York');

    await page.getByLabel('Name').fill('Team lunch');
    await page.getByRole('button', { name: 'Save event' }).click();

    await expect(page).toHaveURL(`/en/e/${event.slug}`);
    await expect(page.getByRole('heading', { name: 'Team lunch' })).toBeVisible();
  });

  test('REQ-17: another organizer gets a 404 on the edit page', async ({ page, context }) => {
    const owner = await db.user.create({ data: { email: 'owner2@example.com', name: 'Owner2' } });
    const event = await db.event.create({
      data: {
        slug: 'evt-edit0002',
        ownerId: owner.id,
        name: 'Team dinner',
        description: 'Pasta night',
        startsAt: fromZonedTime(`${futureDate(7)}T19:00:00`, 'America/New_York'),
        timezone: 'America/New_York',
      },
    });
    await signInAs(context, { email: 'other@example.com', name: 'Other' });

    const res = await page.goto(`/en/e/${event.slug}/edit`);
    expect(res?.status()).toBe(404);
  });

  test('REQ-17: an ended event cannot be edited', async ({ page, context }) => {
    const { id: ownerId } = await signInAs(context, { email: 'ended@example.com', name: 'Ended' });
    const event = await db.event.create({
      data: {
        slug: 'evt-edit0003',
        ownerId,
        name: 'Old party',
        description: 'It happened',
        startsAt: new Date('2020-01-01T00:00:00.000Z'),
        timezone: 'America/New_York',
      },
    });

    await page.goto(`/en/e/${event.slug}/edit`);
    await expect(page.getByText('This event has ended')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save event' })).toHaveCount(0);

    await page.goto(`/en/e/${event.slug}`);
    await expect(page.getByRole('link', { name: 'Edit' })).toHaveCount(0);
  });
});

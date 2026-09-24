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

import { test, expect } from '@playwright/test';
import { resetDatabase, db } from './helpers/db';
import { signInAs } from './helpers/auth';
import { futureDate } from './helpers/dates';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-51: Fill with AI', () => {
  test('REQ-51: Fill with AI fills the form and the organizer saves it', async ({
    page,
    context,
  }) => {
    await signInAs(context, { email: 'organizer@example.com', name: 'Organizer' });
    await page.goto('/en/events/new');

    await page.getByLabel('Describe your event').fill("Team dinner next Friday 7pm at Mario's");
    await page.getByRole('button', { name: 'Fill with AI' }).click();

    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Team dinner');
    await expect(page.getByLabel('Location (optional)', { exact: true })).toHaveValue("Mario's");
    await expect(page.getByLabel('Date', { exact: true })).toHaveValue('2030-10-04');
    await expect(page.getByLabel('Time', { exact: true })).toHaveValue('19:00');
    await expect(page.getByLabel('Timezone', { exact: true })).toHaveValue('America/New_York');

    await expect(page).toHaveURL(/\/en\/events\/new$/);
    expect(await db.event.count()).toBe(0);

    await page.getByRole('button', { name: 'Save event' }).click();

    await expect(page).toHaveURL(/\/en\/e\/[\w-]+$/);
    expect(await db.event.count()).toBe(1);
  });

  test('REQ-51: an AI failure shows the fallback message and the manual form still works', async ({
    page,
    context,
  }) => {
    await signInAs(context, { email: 'organizer2@example.com', name: 'Organizer' });
    await page.goto('/en/events/new');

    await page.getByLabel('Describe your event').fill('[[mock-error]] party');
    await page.getByRole('button', { name: 'Fill with AI' }).click();

    await expect(
      page.getByText("Couldn't fill automatically — please fill the form."),
    ).toBeVisible();

    await page.getByLabel('Name', { exact: true }).fill('Board games');
    await page.getByLabel('Description', { exact: true }).fill('Bring snacks');
    await page.getByLabel('Date', { exact: true }).fill(futureDate(7));
    await page.getByLabel('Time', { exact: true }).fill('19:00');
    await page.getByRole('button', { name: 'Save event' }).click();

    await expect(page).toHaveURL(/\/en\/e\/[\w-]+$/);
  });
});

import { test, expect } from '@playwright/test';
import { resetDatabase, db } from './helpers/db';
import { signInAs } from './helpers/auth';
import { seedDemo } from '../src/lib/demo-seed';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-40: a guest RSVPs to the public demo event', () => {
  test('REQ-40: a visitor opens the demo from the home page and RSVPs', async ({ page }) => {
    await seedDemo(db, new Date());

    await page.goto('/en');
    await page.getByRole('link', { name: 'See the demo event' }).click();

    await expect(page.getByRole('heading', { name: 'Community Picnic in the Park' })).toBeVisible();

    await page.getByLabel('Your name').fill('Evaluator');
    await page.getByLabel('How many people, including you?').fill('2');
    await page.getByRole('button', { name: 'Send RSVP' }).click();

    await expect(page.getByText("You're going · 2 people")).toBeVisible();
    await expect(page.getByText('9 people going')).toBeVisible();
  });
});

test.describe('REQ-34: organizer creates an event with AI and sees the guest list', () => {
  test("REQ-34: organizer fills with AI, shares, and sees a guest's RSVP", async ({
    page,
    context,
    browser,
  }) => {
    await signInAs(context, { email: 'organizer-journey@example.com', name: 'Organizer' });
    await page.goto('/en/events/new');
    await page.getByLabel('Describe your event').fill("Team dinner next Friday 7pm at Mario's");
    await page.getByRole('button', { name: 'Fill with AI' }).click();
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Team dinner');

    await page.getByRole('button', { name: 'Save event' }).click();
    await expect(page).toHaveURL(/\/en\/e\/[\w-]+$/);
    const slug = page.url().split('/e/')[1];

    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await guestPage.goto(`/e/${slug}`);
    await guestPage.getByLabel('Your name').fill('Maria');
    await guestPage.getByLabel('How many people, including you?').fill('3');
    await guestPage.getByRole('button', { name: 'Send RSVP' }).click();
    await expect(guestPage.getByText("You're going · 3 people")).toBeVisible();
    await guestContext.close();

    await page.reload();
    const mariaRow = page.getByRole('row', { name: /Maria/ });
    await expect(mariaRow).toContainText('Going');
    await expect(mariaRow).toContainText('3');
    await expect(page.getByText('1 going · 0 declined · 3 people')).toBeVisible();
  });
});

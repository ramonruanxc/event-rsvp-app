import { test, expect } from '@playwright/test';
import { resetDatabase, db } from './helpers/db';
import { seedDemo } from '../src/lib/demo-seed';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-40: a guest RSVPs to the public demo event', () => {
  test('REQ-40: a visitor opens the demo from the home page and RSVPs', async ({ page }) => {
    await seedDemo(db, new Date());

    await page.goto('/en');
    await page.getByRole('link', { name: 'See a demo event' }).click();

    await expect(page.getByRole('heading', { name: 'Community Picnic in the Park' })).toBeVisible();

    await page.getByLabel('Your name').fill('Evaluator');
    await page.getByLabel('How many people, including you?').fill('2');
    await page.getByRole('button', { name: 'Send RSVP' }).click();

    await expect(page.getByText("You're going (2)")).toBeVisible();
    await expect(page.getByText('9 people going')).toBeVisible();
  });
});

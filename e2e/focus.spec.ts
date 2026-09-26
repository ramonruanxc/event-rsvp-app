import { test, expect, type Page } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';
import { createEvent, createOwner, createPasswordUser, createRsvp } from './helpers/factories';

test.beforeEach(async () => {
  await resetDatabase();
});

/** Tag name of the focused element (`BODY` when focus was dropped). */
async function focusedTag(page: Page): Promise<string> {
  return page.evaluate(() => document.activeElement?.tagName ?? 'NONE');
}

test.describe('REQ-136: a failed async action leaves focus on its button', () => {
  test('REQ-136: a wrong password leaves focus on Sign in', async ({ page }) => {
    await createPasswordUser('ana@example.com', 'Ana', 'correct horse');
    await page.goto('/en/sign-in');
    const main = page.locator('main');
    await main.getByLabel('Email').fill('ana@example.com');
    await main.getByLabel('Password', { exact: true }).fill('wrong horse');
    await main.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(main.getByRole('alert')).toHaveText('Email or password is incorrect.');
    await expect(main.getByRole('button', { name: 'Sign in', exact: true })).toBeFocused();
    expect(await focusedTag(page)).not.toBe('BODY');
  });

  test('REQ-136: a duplicate RSVP name leaves focus on Send RSVP', async ({ page }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);
    await createRsvp(event.id, 'Maria');

    await page.goto(`/en/e/${event.slug}`);
    await page.getByLabel('Your name').fill('maria');
    await page.getByRole('button', { name: 'Send RSVP' }).click();

    await expect(page.locator('main').getByRole('alert')).toHaveText(
      'This name is already on the list. Use a different name or ask the organizer.',
    );
    await expect(page.getByRole('button', { name: 'Send RSVP' })).toBeFocused();
  });

  test('REQ-136: a failed AI fill leaves focus on Fill with AI', async ({ page, context }) => {
    await signInAs(context, { email: 'focus-ai@example.com', name: 'Focus' });
    await page.goto('/en/events/new');
    await page.getByLabel('Describe your event').fill('[[mock-error]] party');
    await page.getByRole('button', { name: 'Fill with AI' }).click();

    await expect(
      page.getByText(
        'The AI service is unavailable right now — try again later, or fill the form below.',
      ),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fill with AI' })).toBeFocused();
  });
});

test.describe('REQ-137: a failed validation focuses the first invalid field', () => {
  test('REQ-137: an empty RSVP name focuses Your name, with no alert', async ({ page }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);

    await page.goto(`/en/e/${event.slug}`);
    await page.getByRole('button', { name: 'Send RSVP' }).click();

    await expect(page.getByLabel('Your name')).toBeFocused();
    await expect(page.getByText('This field is required.')).toBeVisible();
    await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
  });

  test('REQ-137: an empty event form focuses Name', async ({ page, context }) => {
    await signInAs(context, { email: 'focus-form@example.com', name: 'Focus' });
    await page.goto('/en/events/new');
    await page.getByRole('button', { name: 'Save event' }).click();

    await expect(page.getByLabel('Name', { exact: true })).toBeFocused();
    expect(await focusedTag(page)).toBe('INPUT');
  });
});

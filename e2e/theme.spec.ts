import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';
import { createEvent, createOwner } from './helpers/factories';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-62/REQ-63: theme rendered from the cookie', () => {
  test('REQ-62: a first visit renders the dark theme', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('REQ-63: the stored theme is already in the server HTML', async ({ page, context }) => {
    await context.addCookies([{ name: 'theme', value: 'light', domain: 'localhost', path: '/' }]);
    const res = await page.goto('/en');
    expect(await res!.text()).toMatch(/<html[^>]*\sdata-theme="light"/);

    await context.addCookies([{ name: 'theme', value: 'purple', domain: 'localhost', path: '/' }]);
    const res2 = await page.goto('/en');
    expect(await res2!.text()).toMatch(/<html[^>]*\sdata-theme="dark"/);
  });
});

test.describe('REQ-64/REQ-75: the header on every page', () => {
  test('REQ-64: every page has the theme toggle in its header', async ({ page, context }) => {
    const owner = await createOwner();
    const guestEvent = await createEvent(owner.id);

    for (const path of ['/en', `/en/e/${guestEvent.slug}`]) {
      await page.goto(path);
      const toggle = page.getByRole('banner').getByRole('button', { name: 'Dark theme' });
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    }

    const ana = await signInAs(context, { email: 'ana@example.com', name: 'Ana' });
    const ownEvent = await createEvent(ana.id);

    for (const path of ['/en/dashboard', '/en/events/new', `/en/e/${ownEvent.slug}`]) {
      await page.goto(path);
      const toggle = page.getByRole('banner').getByRole('button', { name: 'Dark theme' });
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('REQ-64: switching to light applies at once and is remembered', async ({
    page,
    context,
  }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);

    await page.goto('/en');
    await page.getByRole('banner').getByRole('button', { name: 'Dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(
      page.getByRole('banner').getByRole('button', { name: 'Dark theme' }),
    ).toHaveAttribute('aria-pressed', 'false');
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'theme')?.value).toBe('light');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(
      page.getByRole('banner').getByRole('button', { name: 'Dark theme' }),
    ).toHaveAttribute('aria-pressed', 'false');

    await page.goto(`/en/e/${event.slug}`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('REQ-75: every page header shows the logo mark in the home link', async ({
    page,
    context,
  }) => {
    const owner = await createOwner();
    const guestEvent = await createEvent(owner.id);
    const ana = await signInAs(context, { email: 'ana@example.com', name: 'Ana' });
    const ownEvent = await createEvent(ana.id);

    const paths = [
      '/en',
      `/en/e/${guestEvent.slug}`,
      '/en/dashboard',
      '/en/events/new',
      `/en/e/${ownEvent.slug}`,
    ];
    for (const path of paths) {
      await page.goto(path);
      const link = page.getByRole('banner').getByRole('link', { name: 'Event RSVP' });
      await expect(link).toHaveAttribute('href', '/en');
      const mark = link.locator('svg[data-logo-mark]');
      await expect(mark).toHaveCount(1);
      await expect(mark).toHaveAttribute('aria-hidden', 'true');
    }
  });
});

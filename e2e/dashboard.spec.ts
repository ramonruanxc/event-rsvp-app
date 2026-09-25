import { test, expect } from '@playwright/test';
import { db, resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-36: the organizer dashboard', () => {
  test('REQ-36: lists upcoming and past events with counts', async ({ page, context }) => {
    const { id: ownerId } = await signInAs(context, { email: 'ana@example.com', name: 'Ana' });

    const upcoming = await db.event.create({
      data: {
        slug: 'evt-upcoming1',
        ownerId,
        name: 'Team dinner',
        description: 'Pasta night',
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        timezone: 'America/New_York',
      },
    });
    await db.event.create({
      data: {
        slug: 'evt-oldparty1',
        ownerId,
        name: 'Old party',
        description: 'It happened',
        startsAt: new Date('2020-01-01T00:00:00.000Z'),
        timezone: 'America/New_York',
      },
    });
    await db.rsvp.create({
      data: {
        eventId: upcoming.id,
        name: 'Maria',
        nameKey: 'maria',
        status: 'GOING',
        partySize: 2,
        editTokenHash: 'a'.repeat(64),
      },
    });
    await db.rsvp.create({
      data: {
        eventId: upcoming.id,
        name: 'Joao',
        nameKey: 'joao',
        status: 'NOT_GOING',
        partySize: 0,
        editTokenHash: 'b'.repeat(64),
      },
    });

    await page.goto('/en/dashboard');

    await expect(page.getByRole('heading', { name: 'My events' })).toBeVisible();

    const upcomingRegion = page.getByRole('region', { name: 'Upcoming' });
    await expect(upcomingRegion.getByRole('link', { name: 'Team dinner' })).toHaveAttribute(
      'href',
      `/en/e/${upcoming.slug}`,
    );
    await expect(upcomingRegion.getByText('1 going · 1 declined · 2 people')).toBeVisible();
    await expect(upcomingRegion.locator('.date-tile')).toHaveAttribute('aria-hidden', 'true');

    const pastRegion = page.getByRole('region', { name: 'Past' });
    await expect(pastRegion.getByRole('link', { name: 'Old party' })).toBeVisible();
    await expect(pastRegion.getByText('No replies yet')).toBeVisible();

    await expect(page.getByRole('link', { name: 'Create event' })).toHaveAttribute(
      'href',
      '/en/events/new',
    );
  });

  test('REQ-36: an organizer without events sees the empty state', async ({ page, context }) => {
    await signInAs(context, { email: 'empty@example.com', name: 'Empty' });

    await page.goto('/en/dashboard');

    await expect(page.getByText('You have no events yet.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create event' })).toBeVisible();
  });

  test('REQ-82: the empty dashboard explains three steps and offers both actions', async ({
    page,
    context,
  }) => {
    await signInAs(context, { email: 'steps@example.com', name: 'Steps' });

    await page.goto('/en/dashboard');

    const steps = page.locator('main ol.steps > li');
    await expect(steps).toHaveCount(3);
    await expect(steps.nth(0)).toContainText('Create an event');
    await expect(steps.nth(1)).toContainText('Share one link');
    await expect(steps.nth(2)).toContainText('Watch replies come in');

    await expect(page.getByRole('link', { name: 'Create event' })).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Create event' })).toHaveAttribute(
      'href',
      '/en/events/new',
    );
    await expect(page.getByRole('button', { name: 'Create sample event' })).toBeVisible();
    await expect(
      page.getByText(
        "The sample comes with five fictional guests so you can look around. Delete it when you're done.",
      ),
    ).toBeVisible();
  });
});

test.describe('REQ-37: create sample event', () => {
  test('REQ-37: an organizer with no events creates the sample event', async ({
    page,
    context,
  }) => {
    await signInAs(context, { email: 'sample1@example.com', name: 'Sample' });

    await page.goto('/en/dashboard');
    await page.getByRole('button', { name: 'Create sample event' }).click();

    await expect(page).toHaveURL(/\/en\/e\/[^/]+$/);
    await expect(page.getByText('Alex Martin')).toBeVisible();
    await expect(page.getByText('Chloé Dubois')).toBeVisible();
    await expect(page.getByText('4 going · 1 declined · 7 people')).toBeVisible();
  });
});

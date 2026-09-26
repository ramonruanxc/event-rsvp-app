import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';
import { createOwner, createEvent, createRsvp } from './helpers/factories';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-71: RSVP form targets are large enough', () => {
  test('REQ-71: the answer, stepper and submit controls are at least 44×44 px', async ({
    page,
  }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);

    await page.goto(`/en/e/${event.slug}`);

    for (const locator of [
      page.getByLabel('Going', { exact: true }),
      page.getByLabel('Not going', { exact: true }),
      page.getByRole('button', { name: 'One less person' }),
      page.getByRole('button', { name: 'One more person' }),
      page.getByRole('button', { name: 'Send RSVP' }),
    ]) {
      const box = await locator.boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('REQ-73: the guest event page works at 375 px', () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test('REQ-73: a long event name and location never cause horizontal scrolling at 375 px', async ({
    page,
  }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id, {
      name: 'Supercalifragilisticexpialidociousneighbourhoodgettogether2026',
      location: 'https://maps.example.com/riverside-park/north-entrance/picnic-area-7',
    });

    await page.goto(`/en/e/${event.slug}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      375,
    );

    await page.getByLabel('Your name').fill('Maria');
    await page.getByRole('button', { name: 'Send RSVP' }).click();
    await expect(page.getByText("You're going · 1 person")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      375,
    );
  });
});

test.describe('REQ-84: the "Ended" pill', () => {
  test('REQ-84: an ended event shows the "Ended" pill with a clock icon', async ({ page }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id, {
      startsAt: new Date('2020-01-01T19:00:00Z'),
    });

    await page.goto(`/en/e/${event.slug}`);

    await expect(page.locator('.pill-ended')).toHaveText('Ended');
    await expect(page.locator('.pill-ended svg.lucide-clock')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});

test.describe('REQ-152: an ended event reads as ended', () => {
  test('REQ-152: guest and owner see the past tense, no calendar link, and the closed hint', async ({
    page,
    context,
  }) => {
    const owner = await createOwner('ended-owner@example.com');
    const event = await createEvent(owner.id, { startsAt: new Date('2020-01-01T19:00:00Z') });
    await createRsvp(event.id, 'Maria', 'GOING', 2);

    await page.goto(`/en/e/${event.slug}`);
    await expect(page.getByText('2 people went')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Add to calendar' })).toHaveCount(0);

    await signInAs(context, { email: 'ended-owner@example.com', name: 'Owner' });
    await page.goto(`/en/e/${event.slug}`);
    await expect(page.getByText('2 people went')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Add to calendar' })).toHaveCount(0);
    await expect(page.locator('#invite-link-hint')).toHaveText(
      'Replies are closed, so answers can no longer be sent or changed.',
    );
    await expect(page.getByText('Anyone with this link can reply')).toHaveCount(0);
  });
});

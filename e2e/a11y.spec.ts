import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';
import { createOwner, createEvent, createRsvp } from './helpers/factories';
import { tabTo, focusRings } from './helpers/keyboard';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-66: visible focus indicator', () => {
  test('REQ-66: the first Tab on the home page shows a 2 px solid focus ring', async ({ page }) => {
    await page.goto('/en');
    await page.keyboard.press('Tab');

    const outline = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement as Element);
      return { style: s.outlineStyle, width: s.outlineWidth };
    });

    expect(outline).toEqual({ style: 'solid', width: '2px' });
  });

  test('REQ-66: every focusable control shows a 2 px solid focus ring', async ({
    page,
    context,
  }) => {
    async function checkRings() {
      const rings = await focusRings(page);
      expect(rings.length).toBeGreaterThan(5);
      expect(rings.filter((r) => r.style !== 'solid' || r.width !== '2px')).toEqual([]);
    }

    const owner = await createOwner();
    const guestEvent = await createEvent(owner.id);
    await page.goto(`/en/e/${guestEvent.slug}`);
    await checkRings();

    const { id: ownerId } = await signInAs(context, {
      email: 'kb-focus@example.com',
      name: 'Focus',
    });
    const ownerEvent = await createEvent(ownerId);
    await createRsvp(ownerEvent.id, 'Maria', 'GOING', 3);
    await page.goto(`/en/e/${ownerEvent.slug}`);
    await checkRings();

    await page.goto('/en/events/new');
    await checkRings();
  });
});

test.describe('REQ-67: keyboard-only interaction', () => {
  test('REQ-67: a guest answers with the keyboard only', async ({ page }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);

    await page.goto(`/en/e/${event.slug}`);

    await tabTo(page, '#rsvp-name');
    await page.keyboard.type('Kim');

    await tabTo(page, 'input[name="rsvp-status"]');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByLabel('Not going', { exact: true })).toBeChecked();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByLabel('Going', { exact: true })).toBeChecked();

    await tabTo(page, 'button[aria-label="One more person"]');
    await page.keyboard.press('Enter');
    await expect(page.locator('#rsvp-party-size')).toHaveValue('2');

    await tabTo(page, 'button[type="submit"]');
    await page.keyboard.press('Enter');
    await expect(page.getByText("You're going · 2 people")).toBeVisible();
  });

  test('REQ-67: the owner deletes an event with the keyboard only', async ({ page, context }) => {
    const { id: ownerId } = await signInAs(context, {
      email: 'kb-delete@example.com',
      name: 'Del',
    });
    const event = await createEvent(ownerId);

    await page.goto(`/en/e/${event.slug}`);

    await tabTo(page, 'button[aria-expanded="false"]');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Keep' })).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/en\/dashboard$/);
  });

  test('REQ-67: the theme toggle and the account menu work from the keyboard', async ({
    page,
    context,
  }) => {
    await signInAs(context, { email: 'kb-menu@example.com', name: 'Menu' });
    await page.goto('/en');

    await tabTo(page, 'button.theme-toggle');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await tabTo(page, 'summary');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('banner').getByRole('link', { name: 'My events' })).toBeVisible();
  });
});

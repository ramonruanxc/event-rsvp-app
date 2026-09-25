import { test, expect, type Page } from '@playwright/test';
import { db, resetDatabase } from './helpers/db';
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

/** Ids of `main` form controls with no visible label (REQ-68). */
async function labelOffenders(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const offenders: string[] = [];
    const elements = document.querySelectorAll(
      'main input:not([type="hidden"]), main select, main textarea',
    );
    for (const el of Array.from(elements)) {
      if (el.closest('[aria-hidden="true"]')) continue;
      const label = (el as HTMLInputElement).labels?.[0];
      let offender = false;
      if (!label) {
        offender = true;
      } else {
        const rect = label.getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1 || label.classList.contains('sr-only')) {
          offender = true;
        }
      }
      if (offender) offenders.push((el as HTMLElement).id);
    }
    return offenders;
  });
}

/** Number of `svg` elements not hidden from assistive technology (REQ-78). */
async function exposedSvgCount(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      [...document.querySelectorAll('svg')].filter((s) => !s.closest('[aria-hidden="true"]'))
        .length,
  );
}

/** `"tag text WxH"` for every interactive control smaller than 24x24 px (REQ-71). */
async function targetSizeOffenders(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const offenders: string[] = [];
    const elements = document.querySelectorAll(
      'a[href], button, input:not([type="hidden"]), select, textarea, summary',
    );
    for (const el of Array.from(elements)) {
      if (el.getAttribute('tabindex') === '-1') continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width < 24 || height < 24) {
        offenders.push(
          `${el.tagName.toLowerCase()} ${(el.textContent ?? '').trim()} ${width}x${height}`,
        );
      }
    }
    return offenders;
  });
}

test.describe('REQ-68, REQ-71, REQ-78: labels, hidden icons and target sizes', () => {
  test('REQ-68: every form input in main has a visible label', async ({ page, context }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);

    await page.goto(`/en/e/${event.slug}`);
    expect(await labelOffenders(page)).toEqual([]);

    const { id: ownerId } = await signInAs(context, {
      email: 'labels@example.com',
      name: 'Labels',
    });
    const ownerEvent = await createEvent(ownerId);
    await createRsvp(ownerEvent.id, 'Maria', 'GOING', 3);
    await page.goto(`/en/e/${ownerEvent.slug}`);
    expect(await labelOffenders(page)).toEqual([]);

    await page.goto('/en/events/new');
    expect(await labelOffenders(page)).toEqual([]);
  });

  test('REQ-78: no svg is exposed to assistive technology', async ({ page, context }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);

    await page.goto('/en');
    expect(await exposedSvgCount(page)).toBe(0);

    await page.goto(`/en/e/${event.slug}`);
    expect(await exposedSvgCount(page)).toBe(0);

    await page.getByLabel('Your name').fill('Maria');
    await page.getByRole('button', { name: 'Send RSVP' }).click();
    await expect(page.getByText("You're going · 1 person")).toBeVisible();
    expect(await exposedSvgCount(page)).toBe(0);

    const { id: ownerId } = await signInAs(context, { email: 'svg@example.com', name: 'Svg' });
    const ownerEvent = await createEvent(ownerId);
    await createRsvp(ownerEvent.id, 'Maria', 'GOING', 3);
    await page.goto(`/en/e/${ownerEvent.slug}`);
    expect(await exposedSvgCount(page)).toBe(0);

    await page.goto('/en/dashboard');
    expect(await exposedSvgCount(page)).toBe(0);

    await page.goto('/en/events/new');
    expect(await exposedSvgCount(page)).toBe(0);
  });

  test('REQ-71: every interactive control is at least 24x24 px', async ({ page, context }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id);

    await page.goto('/en');
    expect(await targetSizeOffenders(page)).toEqual([]);

    await page.goto(`/en/e/${event.slug}`);
    expect(await targetSizeOffenders(page)).toEqual([]);

    const { id: ownerId } = await signInAs(context, {
      email: 'targets@example.com',
      name: 'Targets',
    });
    const ownerEvent = await createEvent(ownerId);
    await createRsvp(ownerEvent.id, 'Maria', 'GOING', 3);
    await page.goto(`/en/e/${ownerEvent.slug}`);
    expect(await targetSizeOffenders(page)).toEqual([]);

    await page.goto('/en/dashboard');
    expect(await targetSizeOffenders(page)).toEqual([]);

    await page.goto('/en/events/new');
    expect(await targetSizeOffenders(page)).toEqual([]);
  });
});

/** Label, target-size, hidden-icon and focus-ring checks for the current page (REQ-129). */
async function checkAccessiblePage(page: Page) {
  expect(await labelOffenders(page)).toEqual([]);
  expect(await targetSizeOffenders(page)).toEqual([]);
  expect(await exposedSvgCount(page)).toBe(0);
  const rings = await focusRings(page);
  expect(rings.length).toBeGreaterThan(3);
  expect(rings.filter((r) => r.style !== 'solid' || r.width !== '2px')).toEqual([]);
}

test.describe('REQ-129: sign-in, register and account pages', () => {
  test('REQ-129: labels, target sizes, hidden icons and focus rings in both themes', async ({
    page,
    context,
  }) => {
    for (const theme of ['dark', 'light'] as const) {
      await context.clearCookies();
      await context.addCookies([{ name: 'theme', value: theme, domain: 'localhost', path: '/' }]);
      for (const path of ['/en/sign-in', '/en/register']) {
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await checkAccessiblePage(page);
      }

      const email = `ally-${theme}@example.com`;
      await db.user.create({ data: { email, name: 'Ally', passwordNotice: true } });
      await signInAs(context, { email, name: 'Ally' });
      await page.goto('/en/account');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(
        page.getByRole('status').filter({ hasText: 'password on this account was removed' }),
      ).toBeVisible();
      await checkAccessiblePage(page);
    }
  });
});

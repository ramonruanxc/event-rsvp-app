import { test, expect, type Page } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';
import { createOwner, createEvent, createRsvp } from './helpers/factories';

test.beforeEach(async () => {
  await resetDatabase();
});

/**
 * Layout problems on the current page (REQ-77): horizontal page scrolling, plus one entry per
 * `.btn, .pill, .seg span, .label, .brand` element (skipping ones inside `[aria-hidden="true"]`
 * or with no client rect) whose content overflows its own box.
 */
async function layoutProblems(
  page: Page,
): Promise<Array<string | { className: string; text: string }>> {
  return page.evaluate(() => {
    const problems: Array<string | { className: string; text: string }> = [];
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
      problems.push('page scrolls horizontally');
    }
    const elements = document.querySelectorAll('.btn, .pill, .seg span, .label, .brand');
    for (const el of Array.from(elements)) {
      if (el.closest('[aria-hidden="true"]')) continue;
      if (el.getClientRects().length === 0) continue;
      if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) {
        problems.push({ className: el.className, text: (el.textContent ?? '').trim() });
      }
    }
    return problems;
  });
}

test.describe('REQ-77: French layout at 375 and 1280 px', () => {
  test('REQ-77: French pages have no clipped text and no horizontal scrolling', async ({
    page,
    context,
  }) => {
    const guestOwner = await createOwner();
    const guestEvent = await createEvent(guestOwner.id);

    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 800 });

      await page.goto('/fr');
      expect(await layoutProblems(page)).toEqual([]);

      await page.goto(`/fr/e/${guestEvent.slug}`);
      expect(await layoutProblems(page)).toEqual([]);

      if (width === 375) {
        await page.getByLabel('Votre nom').fill('Maria');
        await page.getByRole('button', { name: 'Envoyer la réponse' }).click();
      }
      await expect(page.getByText('Vous venez · 1 personne')).toBeVisible();
      expect(await layoutProblems(page)).toEqual([]);
    }

    const { id: ownerId } = await signInAs(context, {
      email: 'fr-layout@example.com',
      name: 'Layout',
    });
    const ownerEvent = await createEvent(ownerId);
    await createRsvp(ownerEvent.id, 'Maria', 'GOING', 3);
    await createRsvp(ownerEvent.id, 'João', 'NOT_GOING');

    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 800 });

      await page.goto(`/fr/e/${ownerEvent.slug}`);
      expect(await layoutProblems(page)).toEqual([]);

      await page.goto('/fr/dashboard');
      expect(await layoutProblems(page)).toEqual([]);

      await page.goto('/fr/events/new');
      expect(await layoutProblems(page)).toEqual([]);
    }
  });
});

import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { createOwner, createEvent } from './helpers/factories';

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

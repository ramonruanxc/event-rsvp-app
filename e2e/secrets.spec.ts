import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';

test.beforeEach(async () => {
  await resetDatabase();
});

test('REQ-97: nothing sent to the browser during Fill with AI contains a provider key', async ({
  page,
  context,
  baseURL,
}) => {
  const bodies: Promise<string>[] = [];
  page.on('response', (response) => {
    const type = response.headers()['content-type'] ?? '';
    if (
      response.url().startsWith(baseURL!) &&
      /javascript|html|json|text\/x-component/.test(type)
    ) {
      bodies.push(response.text().catch(() => ''));
    }
  });
  await signInAs(context, { email: 'organizer@example.com', name: 'Organizer' });
  await page.goto('/en/events/new');
  await page.getByLabel('Describe your event').fill("Team dinner next Friday 7pm at Mario's");
  await page.getByRole('button', { name: 'Fill with AI' }).click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Team dinner');
  const texts = await Promise.all(bodies);
  expect(texts.length).toBeGreaterThan(0);
  expect(texts.filter((text) => text.includes('test-key'))).toEqual([]);
});

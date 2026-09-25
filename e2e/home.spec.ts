import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-39: the home page', () => {
  test('REQ-39: signed-out home explains the app and offers sign-in and the demo', async ({
    page,
  }) => {
    await page.goto('/en');

    await expect(
      page.getByRole('heading', { name: "Plan an event. Share one link. See who's coming." }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Create an event in seconds — describe it in your own words and let AI fill the form.',
      ),
    ).toBeVisible();

    const main = page.locator('main');
    await expect(main.getByRole('link', { name: 'Sign in', exact: true })).toHaveAttribute(
      'href',
      '/en/sign-in?callbackUrl=%2Fen%2Fdashboard',
    );
    await expect(main.getByRole('link', { name: 'See the demo event' })).toHaveAttribute(
      'href',
      '/en/e/demoPicnic',
    );
  });

  test('REQ-81: the home page previews what a guest sees', async ({ page }) => {
    await page.goto('/en');

    const figure = page.getByRole('figure');
    await expect(figure).toContainText(
      'What a guest sees after tapping your link. One page, one answer.',
    );
    await expect(figure.locator('.ip-card')).toHaveAttribute('aria-hidden', 'true');
  });

  test('REQ-39: signed-in home links to My events', async ({ page, context }) => {
    await signInAs(context, { email: 'home1@example.com', name: 'Home' });

    await page.goto('/en');

    const main = page.locator('main');
    await expect(main.getByRole('link', { name: 'My events' })).toHaveAttribute(
      'href',
      '/en/dashboard',
    );
    await expect(main.getByRole('link', { name: 'Sign in', exact: true })).toHaveCount(0);
  });
});

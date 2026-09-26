import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-126: the sign-in page', () => {
  test('REQ-126: offers Google and email/password, and links to registration', async ({ page }) => {
    await page.goto('/en/sign-in?callbackUrl=%2Fen%2Fevents%2Fnew');
    const main = page.locator('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Continue with Google' })).toHaveAttribute(
      'href',
      '/api/login?callbackUrl=%2Fen%2Fevents%2Fnew',
    );
    await expect(main.getByLabel('Email')).toBeVisible();
    await expect(main.getByLabel('Password')).toBeVisible();
    await expect(main.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/en/register?callbackUrl=%2Fen%2Fevents%2Fnew',
    );
  });

  test('REQ-126: no callback means the dashboard; an unsafe one becomes /', async ({ page }) => {
    const google = page.locator('main').getByRole('link', { name: 'Continue with Google' });
    await page.goto('/en/sign-in');
    await expect(google).toHaveAttribute('href', '/api/login?callbackUrl=%2Fen%2Fdashboard');
    await page.goto('/en/sign-in?callbackUrl=https%3A%2F%2Fevil.com');
    await expect(google).toHaveAttribute('href', '/api/login?callbackUrl=%2F');
  });

  test('REQ-126: an Auth.js error lands here with a generic message', async ({ page }) => {
    await page.goto('/sign-in?error=AccessDenied');
    await expect(page).toHaveURL(/\/en\/sign-in\?error=AccessDenied$/);
    await expect(page.locator('main').getByRole('alert')).toHaveText(
      "Sign-in couldn't be completed. Please try again.",
    );
  });

  test('REQ-126: a signed-in visitor goes straight to the callback', async ({ page, context }) => {
    await signInAs(context, { email: 'ana@example.com', name: 'Ana' });
    await page.goto('/en/sign-in?callbackUrl=%2Fen%2Fevents%2Fnew');
    await expect(page).toHaveURL(/\/en\/events\/new$/);
  });
});

test.describe('REQ-146, REQ-147: the sign-in page', () => {
  test('REQ-147: the forgot-password hint is under Password before any attempt', async ({
    page,
  }) => {
    await page.goto('/en/sign-in');
    await expect(page.locator('#signin-password-hint')).toHaveText(
      'Forgot your password? If your email is a Google account, use Continue with Google above, then set a new password in Account.',
    );
    await page.goto('/fr/sign-in');
    await expect(page.locator('#signin-password-hint')).toHaveText(
      'Mot de passe oublié ? Si votre e-mail est un compte Google, utilisez « Continuer avec Google » ci-dessus, puis définissez un nouveau mot de passe dans Compte.',
    );
  });

  test('REQ-146: no header Sign in link on the auth pages, a gap under the heading, an "or" divider', async ({
    page,
  }) => {
    await page.goto('/en/sign-in');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Sign in' })).toHaveCount(0);
    const heading = (await page.getByRole('heading', { level: 1, name: 'Sign in' }).boundingBox())!;
    const google = (await page
      .locator('main')
      .getByRole('link', { name: 'Continue with Google' })
      .boundingBox())!;
    expect(google.y - (heading.y + heading.height)).toBeGreaterThanOrEqual(16);
    await expect(page.locator('main .divider-or')).toHaveText('or');

    await page.goto('/en/register');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Sign in' })).toHaveCount(0);

    await page.goto('/en');
    await expect(
      page.getByRole('banner').getByRole('link', { name: 'Sign in', exact: true }),
    ).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('REQ-02: protected routes redirect signed-out visitors', () => {
  test('REQ-02: a signed-out visitor to /en/dashboard lands on the sign-in page, whose Google link starts Google', async ({
    page,
  }) => {
    await page.goto('/en/dashboard');
    await expect(page).toHaveURL(/\/en\/sign-in\?callbackUrl=%2Fen%2Fdashboard$/);
    const google = page.locator('main').getByRole('link', { name: 'Continue with Google' });
    await expect(google).toHaveAttribute('href', '/api/login?callbackUrl=%2Fen%2Fdashboard');
    await page.route('https://accounts.google.com/**', (route) => route.abort());
    const request = page.waitForRequest((r) => r.url().startsWith('https://accounts.google.com/'));
    await google.click().catch(() => undefined);
    expect(new URL((await request).url()).searchParams.get('redirect_uri')).toMatch(
      /\/api\/auth\/callback\/google$/,
    );
  });

  test('REQ-02: the Account page also sends a signed-out visitor to sign in', async ({ page }) => {
    await page.goto('/en/account');
    await expect(page).toHaveURL(/\/en\/sign-in\?callbackUrl=%2Fen%2Faccount$/);
  });
});

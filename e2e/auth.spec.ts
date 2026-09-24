import { test, expect } from '@playwright/test';

test.describe('REQ-02: protected routes redirect signed-out visitors', () => {
  test('REQ-02: a signed-out visitor to /en/dashboard is sent to Google and asked to come back', async ({
    page,
  }) => {
    await page.route('https://accounts.google.com/**', (route) => route.abort());
    const login = page.waitForRequest((r) => r.url().includes('/api/login'));
    const google = page.waitForRequest((r) => r.url().startsWith('https://accounts.google.com/'));
    await page.goto('/en/dashboard').catch(() => undefined);
    expect(new URL((await login).url()).searchParams.get('callbackUrl')).toBe('/en/dashboard');
    expect(new URL((await google).url()).searchParams.get('redirect_uri')).toMatch(
      /\/api\/auth\/callback\/google$/,
    );
  });
});

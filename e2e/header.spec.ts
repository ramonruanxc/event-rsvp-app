import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-80: header language, theme and account', () => {
  test('REQ-80: signed out, the header adapts from desktop to a 375 px phone', async ({ page }) => {
    await page.goto('/en');
    const banner = page.getByRole('banner');

    const signIn = banner.getByRole('link', { name: 'Sign in', exact: true });
    await expect(signIn).toBeVisible();
    await expect(signIn).toHaveAttribute('href', '/en/sign-in?callbackUrl=%2Fen%2Fdashboard');
    const wideBox = await page.getByLabel('Language').boundingBox();
    expect(wideBox!.width).toBeGreaterThan(40);

    await page.setViewportSize({ width: 375, height: 740 });
    await expect(banner.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
    const phoneBox = await page.getByLabel('Language').boundingBox();
    expect(phoneBox!.width).toBe(40);
  });

  test('REQ-80: a signed-in organizer reaches My events and Sign out from the account menu', async ({
    page,
    context,
  }) => {
    await signInAs(context, { email: 'ana@example.com', name: 'Ana' });
    await page.goto('/en');
    const banner = page.getByRole('banner');

    const summary = banner.getByLabel('Account menu');
    await expect(summary).toBeVisible();
    await expect(summary).toHaveText('A');

    await summary.click();
    await expect(banner.getByText('Signed in as Ana')).toBeVisible();
    await expect(banner.getByRole('link', { name: 'My events' })).toBeVisible();
    await expect(banner.getByRole('link', { name: 'Account', exact: true })).toHaveAttribute(
      'href',
      '/en/account',
    );
    await expect(banner.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
});

test.describe('REQ-144: the language select from the keyboard', () => {
  test('REQ-144: arrow keys only move the choice; Enter switches and keeps focus', async ({
    page,
  }) => {
    await page.goto('/en');
    const select = page.locator('#locale-select');
    await select.focus();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    await expect(select).toHaveValue('pt-BR');
    await expect(page).toHaveURL(/\/en$/);

    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/pt-BR$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.locator('#locale-select')).toBeFocused();
    await expect(page.locator('#locale-select')).toHaveValue('pt-BR');
  });
});

test.describe('REQ-145: the account menu closes predictably', () => {
  test('REQ-145: Escape closes the menu and returns focus to it', async ({ page, context }) => {
    await signInAs(context, { email: 'menu-esc@example.com', name: 'Menu' });
    await page.goto('/en');
    const banner = page.getByRole('banner');

    await banner.getByLabel('Account menu').focus();
    await page.keyboard.press('Enter');
    await expect(banner.getByRole('link', { name: 'My events' })).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(banner.getByRole('link', { name: 'My events' })).toBeHidden();
    await expect(banner.getByLabel('Account menu')).toBeFocused();
  });
});

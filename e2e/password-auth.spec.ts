import { test, expect, type Page } from '@playwright/test';
import { db, resetDatabase } from './helpers/db';
import { SESSION_COOKIE, signInAs } from './helpers/auth';
import { createGoogleUser, createPasswordUser } from './helpers/factories';

test.beforeEach(async () => {
  await resetDatabase();
});

/** Fills and submits the email/password form on the current sign-in page. */
async function signInWithPassword(page: Page, email: string, password: string) {
  const main = page.locator('main');
  await main.getByLabel('Email').fill(email);
  await main.getByLabel('Password', { exact: true }).fill(password);
  await main.getByRole('button', { name: 'Sign in', exact: true }).click();
}

/** Opens the account menu and signs out. */
async function signOut(page: Page) {
  const banner = page.getByRole('banner');
  await banner.getByLabel('Account menu').click();
  await banner.getByRole('button', { name: 'Sign out' }).click();
  await expect(banner.getByLabel('Account menu')).toHaveCount(0);
}

test.describe('REQ-130: email and password need no Google credentials', () => {
  test('REQ-116: a visitor registers, is signed in at once, signs out and signs in again', async ({
    page,
    context,
  }) => {
    await page.goto('/en/register');
    const main = page.locator('main');
    await main.getByLabel('Name').fill('Ana Lima');
    await main.getByLabel('Email').fill('  Ana@Example.com ');
    await main.getByLabel('Password', { exact: true }).fill('correct horse');
    await main.getByLabel('Confirm password').fill('correct horse');
    await main.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/en\/dashboard$/);
    await expect(page.getByRole('banner').getByLabel('Account menu')).toHaveText('A');
    const row = await db.user.findUniqueOrThrow({ where: { email: 'ana@example.com' } });
    expect(row.name).toBe('Ana Lima');
    expect(row.passwordHash).toMatch(/^scrypt\$32768\$8\$1\$/);

    await signOut(page);
    expect((await context.cookies()).some((c) => c.name === SESSION_COOKIE)).toBe(false);

    await page.goto('/en/sign-in');
    await signInWithPassword(page, 'ana@example.com', 'correct horse');
    await expect(page).toHaveURL(/\/en\/dashboard$/);
    await expect(page.getByRole('banner').getByLabel('Account menu')).toBeVisible();
  });
});

test.describe('REQ-118: one generic sign-in error', () => {
  test('REQ-118: wrong password, unknown email and a Google-only account show the same error', async ({
    page,
  }) => {
    await createPasswordUser('ana@example.com', 'Ana', 'correct horse');
    await createGoogleUser('gil@example.com', 'Gil');
    for (const [email, password] of [
      ['ana@example.com', 'wrong horse'],
      ['nobody@example.com', 'correct horse'],
      ['gil@example.com', 'correct horse'],
    ]) {
      await page.goto('/en/sign-in');
      await signInWithPassword(page, email, password);
      await expect(page.locator('main').getByRole('alert')).toHaveText(
        'Email or password is incorrect.',
      );
      await expect(page).toHaveURL(/\/en\/sign-in$/);
    }
  });
});

test.describe('REQ-117: registration refusal for a Google account', () => {
  test('REQ-117: registering with the email of a Google-only account is refused with guidance', async ({
    page,
  }) => {
    const gil = await createGoogleUser('gil@example.com', 'Gil');
    await page.goto('/en/register');
    const main = page.locator('main');
    await main.getByLabel('Name').fill('Gil Two');
    await main.getByLabel('Email').fill('GIL@example.com');
    await main.getByLabel('Password', { exact: true }).fill('another horse');
    await main.getByLabel('Confirm password').fill('another horse');
    await main.getByRole('button', { name: 'Create account' }).click();

    await expect(main.getByRole('alert')).toHaveText(
      'This email already has an account that uses Google. Sign in with Google, then set a password in Account.',
    );
    expect(await db.user.count()).toBe(1);
    const row = await db.user.findUniqueOrThrow({ where: { id: gil.id } });
    expect(row.name).toBe('Gil');
    expect(row.passwordHash).toBeNull();
  });
});

test.describe('REQ-120: set and change a password on Account', () => {
  test('REQ-120: a Google-only user sets a password and can then sign in with it', async ({
    page,
    context,
  }) => {
    await createGoogleUser('gil@example.com', 'Gil');
    await signInAs(context, { email: 'gil@example.com', name: 'Gil' });
    await page.goto('/en/account');
    const main = page.locator('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Account' })).toBeVisible();
    await expect(main.getByText('Signed in as gil@example.com')).toBeVisible();
    await expect(main.getByRole('heading', { level: 2, name: 'Set a password' })).toBeVisible();
    await expect(main.getByLabel('Current password')).toHaveCount(0);
    await main.getByLabel('New password', { exact: true }).fill('gil password 1');
    await main.getByLabel('Confirm new password').fill('gil password 1');
    await main.getByRole('button', { name: 'Save password' }).click();
    await expect(main.getByRole('status')).toHaveText('Password saved.');
    await expect(main.getByRole('heading', { level: 2, name: 'Change password' })).toBeVisible();

    await signOut(page);
    await page.goto('/en/sign-in');
    await signInWithPassword(page, 'gil@example.com', 'gil password 1');
    await expect(page).toHaveURL(/\/en\/dashboard$/);
  });

  test('REQ-120: changing a password needs the current one', async ({ page, context }) => {
    await createPasswordUser('ana@example.com', 'Ana', 'correct horse');
    await signInAs(context, { email: 'ana@example.com', name: 'Ana' });
    await page.goto('/en/account');
    const main = page.locator('main');
    await expect(main.getByRole('heading', { level: 2, name: 'Change password' })).toBeVisible();
    await main.getByLabel('Current password').fill('wrong horse');
    await main.getByLabel('New password', { exact: true }).fill('new horse 12');
    await main.getByLabel('Confirm new password').fill('new horse 12');
    await main.getByRole('button', { name: 'Save password' }).click();
    await expect(main.getByText('The current password is incorrect.')).toBeVisible();

    await main.getByLabel('Current password').fill('correct horse');
    await main.getByRole('button', { name: 'Save password' }).click();
    await expect(main.getByRole('status')).toHaveText('Password saved.');
  });
});

test.describe('REQ-126: back to the requested page', () => {
  test('REQ-126: a signed-out visitor to a protected page signs in with a password and comes back', async ({
    page,
  }) => {
    await createPasswordUser('ana@example.com', 'Ana', 'correct horse');
    await page.goto('/en/events/new');
    await expect(page).toHaveURL(/\/en\/sign-in\?callbackUrl=%2Fen%2Fevents%2Fnew$/);
    await signInWithPassword(page, 'ana@example.com', 'correct horse');
    await expect(page).toHaveURL(/\/en\/events\/new$/);
  });
});

test.describe('REQ-123: the cleared-password notice', () => {
  test('REQ-123: the notice shows on every page until it is dismissed', async ({
    page,
    context,
  }) => {
    const user = await db.user.create({
      data: {
        email: 'ana@example.com',
        name: 'Ana',
        passwordNotice: true,
        passwordClearedAt: new Date(),
      },
    });
    await signInAs(context, { email: 'ana@example.com', name: 'Ana' });
    const notice = page
      .getByRole('status')
      .filter({ hasText: 'the password on this account was removed' });

    await page.goto('/en/dashboard');
    await expect(notice).toBeVisible();
    await expect(notice.getByRole('link', { name: 'Go to Account' })).toHaveAttribute(
      'href',
      '/en/account',
    );
    await page.goto('/en/account');
    await expect(notice).toBeVisible();

    await notice.getByRole('button', { name: 'Dismiss' }).click();
    await expect(notice).toHaveCount(0);
    await page.reload();
    await expect(notice).toHaveCount(0);
    expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).passwordNotice).toBe(
      false,
    );
  });
});

test.describe('REQ-125: the hash never reaches the browser', () => {
  test('REQ-125: the session endpoint has only id, name and email', async ({ page }) => {
    await createPasswordUser('ana@example.com', 'Ana', 'correct horse');
    await page.goto('/en/sign-in');
    await signInWithPassword(page, 'ana@example.com', 'correct horse');
    await expect(page).toHaveURL(/\/en\/dashboard$/);

    const response = await page.request.get('/api/auth/session');
    const body = await response.text();
    expect(body).not.toContain('scrypt');
    expect(Object.keys(JSON.parse(body).user).sort()).toEqual(['email', 'id', 'name']);
  });
});

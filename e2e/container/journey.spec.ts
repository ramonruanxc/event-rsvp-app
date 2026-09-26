import { test, expect } from '@playwright/test';

const PASSWORD = 'journey horse 42';

/** A calendar date a week from now, `yyyy-MM-dd` (always in the future, whatever the time zone). */
function nextWeek(): string {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

test.describe('REQ-160: regression journey against the docker compose app', () => {
  test('REQ-160: register, create an event, a guest replies, the organizer sees it, sign out, sign in', async ({
    page,
    browser,
  }) => {
    const email = `journey-${Date.now()}@example.com`;
    const main = page.locator('main');
    const banner = page.getByRole('banner');

    // Register → dashboard
    await page.goto('/en/register');
    await main.getByLabel('Name').fill('Journey Organizer');
    await main.getByLabel('Email').fill(email);
    await main.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await main.getByLabel('Confirm password').fill(PASSWORD);
    await main.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/en\/dashboard$/);

    // Create an event: no AI key in the container; the picker buttons focus their fields
    await page.goto('/en/events/new');
    await expect(
      main.getByText("AI fill isn't set up on this server — fill the form below."),
    ).toBeVisible();
    await expect(main.getByRole('button', { name: 'Fill with AI' })).toHaveCount(0);
    await main.getByLabel('Name', { exact: true }).fill('Journey dinner');
    await main.getByLabel('Description', { exact: true }).fill('Regression journey');
    await main.getByRole('button', { name: 'Open calendar' }).click();
    await expect(main.locator('#date')).toBeFocused();
    await page.keyboard.press('Escape');
    await main.locator('#date').fill(nextWeek());
    await main.getByRole('button', { name: 'Open time picker' }).click();
    await expect(main.locator('#time')).toBeFocused();
    await page.keyboard.press('Escape');
    await main.locator('#time').fill('19:00');
    await main.getByRole('button', { name: 'Save event' }).click();
    await expect(page).toHaveURL(/\/en\/e\/[A-Za-z0-9_-]{10}$/);
    const slug = new URL(page.url()).pathname.split('/').pop()!;

    // A guest replies from a separate browser context
    const guestContext = await browser.newContext();
    const guest = await guestContext.newPage();
    await guest.goto(`/en/e/${slug}`);
    await guest.getByLabel('Your name').fill('Guest Journey');
    await guest.getByRole('button', { name: 'One more person' }).click();
    await guest.getByRole('button', { name: 'Send RSVP' }).click();
    await expect(guest.getByRole('heading', { name: "You're going · 2 people" })).toBeVisible();
    await guestContext.close();

    // The organizer sees the guest
    await page.reload();
    await expect(page.getByRole('row', { name: /Guest Journey/ })).toContainText('Going');
    await expect(page.getByText('1 going · 0 declined · 2 people')).toBeVisible();

    // The calendar file
    const ics = await page.request.get(`/e/${slug}/calendar.ics`);
    expect(ics.status()).toBe(200);
    expect(ics.headers()['content-type']).toContain('text/calendar');
    expect(await ics.text()).toContain('SUMMARY:Journey dinner');

    // Sign out
    await banner.getByLabel('Account menu').click();
    await banner.getByRole('button', { name: 'Sign out' }).click();
    await expect(banner.getByLabel('Account menu')).toHaveCount(0);

    // A wrong password shows the generic error, then the right one signs in
    await page.goto('/en/sign-in');
    await main.getByLabel('Email').fill(email);
    await main.getByLabel('Password', { exact: true }).fill('wrong horse 42');
    await main.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(main.getByRole('alert')).toHaveText('Email or password is incorrect.');
    await main.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await main.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/en\/dashboard$/);
    await expect(main.getByText('Journey dinner')).toBeVisible();
  });
});

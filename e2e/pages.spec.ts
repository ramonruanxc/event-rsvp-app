import { test, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';
import { signInAs } from './helpers/auth';
import { createEvent, createOwner } from './helpers/factories';
import { axeViolations } from './helpers/axe';

test.beforeEach(async () => {
  await resetDatabase();
});

test.describe('REQ-134: page titles', () => {
  test('REQ-134: signed-out pages have their titles and the description', async ({ page }) => {
    const owner = await createOwner();
    const event = await createEvent(owner.id, { name: 'Team dinner' });

    await page.goto('/en');
    await expect(page).toHaveTitle('Event RSVP');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      "Create an event, share one link, see who's coming.",
    );
    await page.goto('/en/sign-in');
    await expect(page).toHaveTitle('Sign in · Event RSVP');
    await page.goto('/en/register');
    await expect(page).toHaveTitle('Create an account · Event RSVP');
    await page.goto(`/en/e/${event.slug}`);
    await expect(page).toHaveTitle('Team dinner · Event RSVP');
    await page.goto('/fr/sign-in');
    await expect(page).toHaveTitle('Connexion · Event RSVP');
    await page.goto('/en/nope-page');
    await expect(page).toHaveTitle('This page does not exist. · Event RSVP');
    await page.goto('/fr/nope-page');
    await expect(page).toHaveTitle("Cette page n'existe pas. · Event RSVP");
    await page.goto('/en/e/unknown0001');
    await expect(page).toHaveTitle('This page does not exist. · Event RSVP');
  });

  test('REQ-134: signed-in pages have their titles in each language', async ({ page, context }) => {
    const { id } = await signInAs(context, { email: 'titles@example.com', name: 'Titles' });
    const event = await createEvent(id, { name: 'Team dinner' });
    const cases: [string, string][] = [
      ['/en/dashboard', 'My events · Event RSVP'],
      ['/en/events/new', 'New event · Event RSVP'],
      [`/en/e/${event.slug}/edit`, 'Edit event · Event RSVP'],
      ['/en/account', 'Account · Event RSVP'],
      [`/en/e/${event.slug}`, 'Team dinner · Event RSVP'],
      ['/fr/dashboard', 'Mes événements · Event RSVP'],
      ['/fr/account', 'Compte · Event RSVP'],
      ['/pt-BR/events/new', 'Novo evento · Event RSVP'],
      [`/pt-BR/e/${event.slug}/edit`, 'Editar evento · Event RSVP'],
    ];
    for (const [path, title] of cases) {
      await page.goto(path);
      await expect(page, path).toHaveTitle(title);
    }
  });
});

test.describe('REQ-135: the localized not-found page', () => {
  test('REQ-135: an unknown path renders the not-found page inside the layout', async ({
    page,
  }) => {
    const response = await page.goto('/en/nope');

    expect(response?.status()).toBe(404);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('data-theme', /^(dark|light)$/);
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: 'This page does not exist.' }),
    ).toBeVisible();
    await expect(
      page.getByText('The link may be mistyped, or the event was deleted.'),
    ).toBeVisible();
    await expect(
      page.locator('main').getByRole('link', { name: 'Go to the home page' }),
    ).toHaveAttribute('href', '/en');
  });

  test('REQ-135: a nested unknown path in French is in French', async ({ page }) => {
    const response = await page.goto('/fr/nope/deeper');

    expect(response?.status()).toBe(404);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(
      page.getByRole('heading', { level: 1, name: "Cette page n'existe pas." }),
    ).toBeVisible();
    await expect(
      page.getByText("Le lien est peut-être mal saisi, ou l'événement a été supprimé."),
    ).toBeVisible();
    await expect(
      page.locator('main').getByRole('link', { name: "Aller à l'accueil" }),
    ).toHaveAttribute('href', '/fr');
  });

  test('REQ-135: an unknown event slug shows the hint and the way home', async ({ page }) => {
    const response = await page.goto('/pt-BR/e/unknown0001');

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Esta página não existe.' }),
    ).toBeVisible();
    await expect(
      page.getByText('O link pode estar digitado errado, ou o evento foi excluído.'),
    ).toBeVisible();
    await expect(
      page.locator('main').getByRole('link', { name: 'Ir para a página inicial' }),
    ).toHaveAttribute('href', '/pt-BR');
  });
});

test.describe('REQ-134, REQ-135: axe page title and language checks', () => {
  const rules = ['document-title', 'html-has-lang'];

  test('REQ-134: every page passes axe document-title and html-has-lang', async ({
    page,
    context,
  }) => {
    const guestOwner = await createOwner();
    const guestEvent = await createEvent(guestOwner.id);
    for (const path of [
      '/en',
      '/en/sign-in',
      '/en/register',
      `/en/e/${guestEvent.slug}`,
      '/en/nope',
      '/en/e/unknown0001',
    ]) {
      await page.goto(path);
      expect(await axeViolations(page, rules), path).toEqual([]);
    }

    const { id } = await signInAs(context, { email: 'axe@example.com', name: 'Axe' });
    const ownEvent = await createEvent(id);
    for (const path of [
      '/en/dashboard',
      '/en/events/new',
      `/en/e/${ownEvent.slug}`,
      `/en/e/${ownEvent.slug}/edit`,
      '/en/account',
    ]) {
      await page.goto(path);
      expect(await axeViolations(page, rules), path).toEqual([]);
    }
  });
});

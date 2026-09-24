import { describe, expect, it } from 'vitest';
import { editTokenCookieName, editTokenCookies, editTokenExpiry } from './edit-token-cookie';

describe('editTokenExpiry', () => {
  it('REQ-24: is 30 days after the event start', () => {
    expect(editTokenExpiry(new Date('2026-10-02T23:00:00.000Z'))).toEqual(
      new Date('2026-11-01T23:00:00.000Z'),
    );
  });
});

describe('editTokenCookies', () => {
  it("REQ-24: returns one cookie per locale, scoped to that locale's event path", () => {
    const expires = new Date('2026-11-01T23:00:00.000Z');

    const cookies = editTokenCookies('abc', 'tok', expires);

    expect(cookies).toEqual([
      {
        name: 'rsvp_edit_en',
        value: 'tok',
        path: '/en/e/abc',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires,
      },
      {
        name: 'rsvp_edit_fr',
        value: 'tok',
        path: '/fr/e/abc',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires,
      },
      {
        name: 'rsvp_edit_pt-BR',
        value: 'tok',
        path: '/pt-BR/e/abc',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires,
      },
    ]);
  });
});

describe('editTokenCookieName', () => {
  it('REQ-24: builds the cookie name for one locale', () => {
    expect(editTokenCookieName('fr')).toBe('rsvp_edit_fr');
  });
});

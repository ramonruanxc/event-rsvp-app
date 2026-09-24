import { routing } from '@/i18n/routing';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Shape of one RSVP edit-token cookie, ready to hand to the cookie store (REQ-24). */
export interface EditTokenCookie {
  name: string;
  value: string;
  path: string;
  httpOnly: true;
  secure: true;
  sameSite: 'lax';
  expires: Date;
}

/** The instant an RSVP edit-token cookie stops being valid: 30 days after the event starts (BR-31). */
export function editTokenExpiry(startsAt: Date): Date {
  return new Date(startsAt.getTime() + THIRTY_DAYS_MS);
}

/** The name of the edit-token cookie for one locale, e.g. `rsvp_edit_fr`. */
export function editTokenCookieName(locale: string): string {
  return `rsvp_edit_${locale}`;
}

/** Builds one edit-token cookie per supported locale, scoped to that locale's event path (BR-30). */
export function editTokenCookies(slug: string, token: string, expires: Date): EditTokenCookie[] {
  return routing.locales.map((locale) => ({
    name: editTokenCookieName(locale),
    value: token,
    path: `/${locale}/e/${slug}`,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires,
  }));
}

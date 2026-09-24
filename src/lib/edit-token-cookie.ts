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
export function editTokenExpiry(_startsAt: Date): Date {
  throw new Error('not implemented');
}

/** The name of the edit-token cookie for one locale, e.g. `rsvp_edit_fr`. */
export function editTokenCookieName(_locale: string): string {
  throw new Error('not implemented');
}

/** Builds one edit-token cookie per supported locale, scoped to that locale's event path (BR-30). */
export function editTokenCookies(_slug: string, _token: string, _expires: Date): EditTokenCookie[] {
  throw new Error('not implemented');
}

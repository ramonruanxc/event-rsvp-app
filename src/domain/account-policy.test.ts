import { describe, expect, it } from 'vitest';
import { allowGoogleSignIn, passwordSessionValid } from './account-policy';

describe('passwordSessionValid', () => {
  it('REQ-122: a password session opened before the clearing is no longer valid', () => {
    const cleared = { passwordClearedAt: new Date(1_000) };
    expect(passwordSessionValid(undefined, null)).toBe(true);
    expect(passwordSessionValid('1000', cleared)).toBe(true);
    expect(passwordSessionValid(2_000, null)).toBe(false);
    expect(passwordSessionValid(500, { passwordClearedAt: null })).toBe(true);
    expect(passwordSessionValid(999, cleared)).toBe(false);
    expect(passwordSessionValid(1_000, cleared)).toBe(false);
    expect(passwordSessionValid(1_001, cleared)).toBe(true);
  });
});

describe('allowGoogleSignIn', () => {
  it('REQ-121: Google needs a verified email that matches any current session', () => {
    const ok = { emailVerified: true, googleEmail: 'ana@example.com', sessionEmail: null };
    expect(allowGoogleSignIn(ok)).toBe(true);
    for (const emailVerified of [false, undefined, 'true']) {
      expect(allowGoogleSignIn({ ...ok, emailVerified }), String(emailVerified)).toBe(false);
    }
    for (const googleEmail of [null, undefined, '  ']) {
      expect(allowGoogleSignIn({ ...ok, googleEmail }), String(googleEmail)).toBe(false);
    }
    expect(allowGoogleSignIn({ ...ok, sessionEmail: ' Ana@Example.com' })).toBe(true);
    expect(allowGoogleSignIn({ ...ok, sessionEmail: 'bob@example.com' })).toBe(false);
  });
});

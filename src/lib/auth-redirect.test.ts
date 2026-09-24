import { describe, expect, it } from 'vitest';
import { sanitizeCallbackUrl, signInRedirectPath } from './auth-redirect';

describe('auth-redirect', () => {
  it('REQ-02: sanitizeCallbackUrl keeps local paths and rejects everything else', () => {
    expect(sanitizeCallbackUrl('/en/dashboard')).toBe('/en/dashboard');
    expect(sanitizeCallbackUrl('https://evil.com')).toBe('/');
    expect(sanitizeCallbackUrl('//evil.com')).toBe('/');
    expect(sanitizeCallbackUrl(null)).toBe('/');
    expect(sanitizeCallbackUrl('/\\evil.com')).toBe('/');
  });

  it('REQ-02: signInRedirectPath builds the login URL', () => {
    expect(signInRedirectPath('/fr/events/new')).toBe(
      '/api/login?callbackUrl=%2Ffr%2Fevents%2Fnew',
    );
  });
});

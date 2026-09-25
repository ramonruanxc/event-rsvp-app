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

  it('REQ-02: signInRedirectPath goes to the sign-in page of the path locale', () => {
    expect(signInRedirectPath('/fr/events/new')).toBe(
      '/fr/sign-in?callbackUrl=%2Ffr%2Fevents%2Fnew',
    );
    expect(signInRedirectPath('/pt-BR/dashboard')).toBe(
      '/pt-BR/sign-in?callbackUrl=%2Fpt-BR%2Fdashboard',
    );
    expect(signInRedirectPath('/dashboard')).toBe('/en/sign-in?callbackUrl=%2Fdashboard');
    expect(signInRedirectPath('https://evil.com')).toBe('/en/sign-in?callbackUrl=%2F');
  });
});

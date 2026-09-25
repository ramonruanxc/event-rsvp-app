import { routing } from '@/i18n/routing';

/**
 * Keeps `value` only when it is a safe, local redirect path; otherwise falls back to `"/"`.
 * A path is safe when it is a string starting with `/` but not `//` or `/\` (REQ-02, BR-95).
 */
export function sanitizeCallbackUrl(value: string | null | undefined): string {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  return value;
}

/** Builds the sign-in page URL, in the callback path's locale, that returns to `callbackPath` (REQ-02, BR-95). */
export function signInRedirectPath(callbackPath: string): string {
  const safe = sanitizeCallbackUrl(callbackPath);
  const first = safe.split(/[/?#]/)[1] ?? '';
  const locale = (routing.locales as readonly string[]).includes(first)
    ? first
    : routing.defaultLocale;
  return `/${locale}/sign-in?callbackUrl=${encodeURIComponent(safe)}`;
}

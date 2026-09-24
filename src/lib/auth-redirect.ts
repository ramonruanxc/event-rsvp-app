/**
 * Keeps `value` only when it is a safe, local redirect path; otherwise falls back to `"/"`.
 * A path is safe when it is a string starting with `/` but not `//` or `/\` (REQ-02, BR-95).
 */
export function sanitizeCallbackUrl(value: string | null | undefined): string {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  return value;
}

/** Builds the login URL that returns to `callbackPath` after Google sign-in (REQ-02). */
export function signInRedirectPath(callbackPath: string): string {
  return `/api/login?callbackUrl=${encodeURIComponent(sanitizeCallbackUrl(callbackPath))}`;
}

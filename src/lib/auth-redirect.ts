/**
 * Keeps `value` only when it is a safe, local redirect path; otherwise falls back to `"/"`.
 * A path is safe when it is a string starting with `/` but not `//` or `/\` (REQ-02, BR-95).
 */
export function sanitizeCallbackUrl(value: string | null | undefined): string {
  void value;
  throw new Error('not implemented');
}

/** Builds the login URL that returns to `callbackPath` after Google sign-in (REQ-02). */
export function signInRedirectPath(callbackPath: string): string {
  void callbackPath;
  throw new Error('not implemented');
}

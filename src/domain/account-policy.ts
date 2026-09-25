import { normalizeEmail } from './credentials';
import type { UserRecord } from './types';

/** False when a password session was opened before the password was cleared (REQ-122). */
export function passwordSessionValid(
  pwdAt: unknown,
  user: Pick<UserRecord, 'passwordClearedAt'> | null,
): boolean {
  if (typeof pwdAt !== 'number') return true;
  if (!user) return false;
  return user.passwordClearedAt === null || user.passwordClearedAt.getTime() < pwdAt;
}

/** Google may sign in only with a verified email that matches any current session's email (REQ-121). */
export function allowGoogleSignIn(input: {
  emailVerified: unknown;
  googleEmail: string | null | undefined;
  sessionEmail: string | null;
}): boolean {
  if (input.emailVerified !== true) return false;
  if (!input.googleEmail?.trim()) return false;
  if (input.sessionEmail === null) return true;
  return normalizeEmail(input.sessionEmail) === normalizeEmail(input.googleEmail);
}

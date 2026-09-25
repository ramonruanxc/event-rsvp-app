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

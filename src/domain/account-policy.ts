import type { UserRecord } from './types';

/** False when a password session was opened before the password was cleared (REQ-122). */
export function passwordSessionValid(
  _pwdAt: unknown,
  _user: Pick<UserRecord, 'passwordClearedAt'> | null,
): boolean {
  throw new Error('not implemented');
}

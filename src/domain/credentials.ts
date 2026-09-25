export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Trims surrounding whitespace and lower-cases an email address (BR-147). */
export function normalizeEmail(_value: string): string {
  throw new Error('not implemented');
}
/** Length of a password in Unicode code points (BR-148). */
export function passwordLength(_value: string): number {
  throw new Error('not implemented');
}

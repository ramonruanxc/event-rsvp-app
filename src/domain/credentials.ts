export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Trims surrounding whitespace and lower-cases an email address (BR-147). */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
/** Length of a password in Unicode code points (BR-148). */
export function passwordLength(value: string): number {
  return [...value].length;
}

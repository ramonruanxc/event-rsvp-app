/** Hashes and verifies passwords; services depend on this so unit tests can use a fast fake. */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, stored: string): Promise<boolean>;
}

/** scrypt cost (BR-151); maxmem must exceed 128·N·r = 32 MiB. */
export const SCRYPT_PARAMS = {
  N: 32768,
  r: 8,
  p: 1,
  keyLength: 64,
  saltLength: 16,
  maxmem: 64 * 1024 * 1024,
} as const;

/** A well-formed hash that no password matches in practice; verified against when there is no password (REQ-118). */
export const DUMMY_PASSWORD_HASH = `scrypt$32768$8$1$${'A'.repeat(22)}$${'A'.repeat(86)}`;

/** Parts of a stored `scrypt$N$r$p$<salt>$<key>` hash. */
export interface ParsedPasswordHash {
  N: number;
  r: number;
  p: number;
  salt: Buffer;
  key: Buffer;
}

/** Hashes a password with scrypt and a fresh 16-byte salt: `scrypt$N$r$p$<salt>$<key>` (REQ-114, BR-151). */
export async function hashPassword(_password: string): Promise<string> {
  throw new Error('not implemented');
}
/** Splits a stored hash into its parts; null when it is malformed or uses other parameters (REQ-114). */
export function parsePasswordHash(_stored: string): ParsedPasswordHash | null {
  throw new Error('not implemented');
}
/** True when `password` matches `stored`, compared in constant time; false for a malformed hash (REQ-114, BR-152). */
export async function verifyPassword(_password: string, _stored: string): Promise<boolean> {
  throw new Error('not implemented');
}

/** The production PasswordHasher (scrypt). */
export const scryptPasswordHasher: PasswordHasher = { hash: hashPassword, verify: verifyPassword };

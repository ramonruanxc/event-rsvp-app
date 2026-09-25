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

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

/** Derives a scrypt key from the NFKC-normalized password (REQ-114). */
function derive(password: string, salt: Buffer, keyLength: number): Promise<Buffer> {
  const { N, r, p, maxmem } = SCRYPT_PARAMS;
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, keyLength, { N, r, p, maxmem }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** Hashes a password with scrypt and a fresh 16-byte salt: `scrypt$N$r$p$<salt>$<key>` (REQ-114, BR-151). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT_PARAMS.saltLength);
  const key = await derive(password, salt, SCRYPT_PARAMS.keyLength);
  const { N, r, p } = SCRYPT_PARAMS;
  return ['scrypt', N, r, p, salt.toString('base64url'), key.toString('base64url')].join('$');
}
/** Splits a stored hash into its parts; null when it is malformed or uses other parameters (REQ-114). */
export function parsePasswordHash(stored: string): ParsedPasswordHash | null {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return null;
  const [N, r, p] = parts.slice(1, 4).map(Number);
  if (N !== SCRYPT_PARAMS.N || r !== SCRYPT_PARAMS.r || p !== SCRYPT_PARAMS.p) return null;
  const salt = Buffer.from(parts[4], 'base64url');
  const key = Buffer.from(parts[5], 'base64url');
  if (salt.length !== SCRYPT_PARAMS.saltLength || key.length !== SCRYPT_PARAMS.keyLength)
    return null;
  return { N, r, p, salt, key };
}
/** True when `password` matches `stored`, compared in constant time; false for a malformed hash (REQ-114, BR-152). */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parsePasswordHash(stored);
  if (!parsed) return false;
  const key = await derive(password, parsed.salt, parsed.key.length);
  return timingSafeEqual(key, parsed.key);
}

/** The production PasswordHasher (scrypt). */
export const scryptPasswordHasher: PasswordHasher = { hash: hashPassword, verify: verifyPassword };

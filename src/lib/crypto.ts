import { createHash, randomBytes } from 'node:crypto';

/** Generates a fresh RSVP edit token: 32 random bytes, base64url-encoded (REQ-22, BR-28). */
export function generateEditToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Hashes a token (or any value) with SHA-256, returned as lowercase hex (REQ-22, BR-29). */
export function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

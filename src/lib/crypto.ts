/** Generates a fresh RSVP edit token: 32 random bytes, base64url-encoded (REQ-22, BR-28). */
export function generateEditToken(): string {
  throw new Error('not implemented');
}

/** Hashes a token (or any value) with SHA-256, returned as lowercase hex (REQ-22, BR-29). */
export function hashToken(_value: string): string {
  throw new Error('not implemented');
}

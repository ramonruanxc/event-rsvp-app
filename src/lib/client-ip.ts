/** Best-effort client IP from proxy headers: first `x-forwarded-for` entry, else `x-real-ip`, else "unknown" (REQ-56). */
export function clientIp(_headers: Headers): string {
  throw new Error('not implemented');
}

/** Salted SHA-256 hash of a client IP, so the raw address is never stored (REQ-56, BR-80). */
export function hashIp(_ip: string, _salt: string): string {
  throw new Error('not implemented');
}

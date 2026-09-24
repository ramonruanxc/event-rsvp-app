import { hashToken } from './crypto';

/** Best-effort client IP from proxy headers: first `x-forwarded-for` entry, else `x-real-ip`, else "unknown" (REQ-56). */
export function clientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

/** Salted SHA-256 hash of a client IP, so the raw address is never stored (REQ-56, BR-80). */
export function hashIp(ip: string, salt: string): string {
  return hashToken(`${salt}:${ip}`);
}

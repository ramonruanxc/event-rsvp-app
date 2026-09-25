import { describe, expect, it } from 'vitest';
import { securityHeaders } from '../security-headers.mjs';

describe('securityHeaders', () => {
  it('REQ-60: the three security headers are defined', () => {
    expect(securityHeaders).toEqual([
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import { hashToken } from './crypto';
import { clientIp, hashIp } from './client-ip';

describe('clientIp', () => {
  it('REQ-56: takes the first forwarded address', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe(
      '203.0.113.7',
    );
    expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2');
    expect(clientIp(new Headers())).toBe('unknown');
  });
});

describe('hashIp', () => {
  it('REQ-56: is a salted SHA-256 and never the raw IP', () => {
    const hash = hashIp('203.0.113.7', 'salt');
    expect(hash).toBe(hashToken('salt:203.0.113.7'));
    expect(hash).not.toContain('203.0.113.7');
  });
});

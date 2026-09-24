import { describe, expect, it } from 'vitest';
import { generateEditToken, hashToken } from './crypto';

describe('generateEditToken', () => {
  it('REQ-22: an edit token is 32 random bytes in base64url', () => {
    const token = generateEditToken();
    expect(token).toHaveLength(43);
    expect(Buffer.from(token, 'base64url').length).toBe(32);
    expect(generateEditToken()).not.toBe(token);
  });
});

describe('hashToken', () => {
  it('REQ-22: hashToken is SHA-256 hex', () => {
    expect(hashToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

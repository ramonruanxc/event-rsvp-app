import { describe, expect, it, vi } from 'vitest';

vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>();
  return { ...actual, timingSafeEqual: vi.fn(actual.timingSafeEqual) };
});

import { timingSafeEqual } from 'node:crypto';
import { DUMMY_PASSWORD_HASH, hashPassword, parsePasswordHash, verifyPassword } from './password';

describe('password hashing (REQ-114)', () => {
  it('REQ-114: hashes with scrypt, a 16-byte salt and a 64-byte key, a new salt each time', async () => {
    const first = await hashPassword('correct horse');
    const second = await hashPassword('correct horse');
    expect(first).toMatch(/^scrypt\$32768\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{86}$/);
    expect(second).not.toBe(first);
    expect(await verifyPassword('correct horse', first)).toBe(true);
    expect(await verifyPassword('correct horse', second)).toBe(true);
  });

  it('REQ-114: rejects a different password and compares in constant time', async () => {
    const stored = await hashPassword('correct horse');
    vi.mocked(timingSafeEqual).mockClear();
    expect(await verifyPassword('correct horsE', stored)).toBe(false);
    expect(timingSafeEqual).toHaveBeenCalledTimes(1);
  });

  it('REQ-114: normalizes the password (NFKC) before hashing and verifying', async () => {
    const stored = await hashPassword('café horse');
    expect(await verifyPassword('café horse', stored)).toBe(true);
  });

  it('REQ-114: a malformed or foreign hash is false without running scrypt', async () => {
    vi.mocked(timingSafeEqual).mockClear();
    const salt = 'A'.repeat(22);
    const key = 'A'.repeat(86);
    for (const stored of [
      '',
      'plain',
      `scrypt$16384$8$1$${salt}$${key}`,
      `scrypt$32768$8$1$${'A'.repeat(10)}$${key}`,
      `scrypt$32768$8$1$${salt}$${'A'.repeat(40)}`,
      `bcrypt$32768$8$1$${salt}$${key}`,
    ]) {
      expect(parsePasswordHash(stored), stored).toBeNull();
      expect(await verifyPassword('correct horse', stored), stored).toBe(false);
    }
    expect(timingSafeEqual).not.toHaveBeenCalled();
  });

  it('REQ-114: the dummy hash is well formed, so verifying against it costs a full scrypt', async () => {
    const parsed = parsePasswordHash(DUMMY_PASSWORD_HASH);
    expect(parsed).not.toBeNull();
    expect(parsed!.salt).toHaveLength(16);
    expect(parsed!.key).toHaveLength(64);
    vi.mocked(timingSafeEqual).mockClear();
    expect(await verifyPassword('anything', DUMMY_PASSWORD_HASH)).toBe(false);
    expect(timingSafeEqual).toHaveBeenCalledTimes(1);
  });
});

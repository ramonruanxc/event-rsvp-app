import { describe, expect, it } from 'vitest';
import { InvalidCredentialsError, RateLimitedError } from '@/domain/errors';
import { hashToken } from '@/lib/crypto';
import { DUMMY_PASSWORD_HASH } from '@/lib/password';
import { createMemoryRepositories } from '@/repositories/memory';
import { fakeHasher } from '@/test/fake-hasher';
import { RateLimiter } from './rate-limiter';
import { SignInWithPasswordService } from './sign-in-with-password';

async function arrange() {
  const { users, rateLimits, store } = createMemoryRepositories();
  const clock = { now: new Date('2026-09-25T12:00:00.000Z') };
  const rateLimiter = new RateLimiter({ repo: rateLimits, now: () => clock.now });
  const { hasher, verified } = fakeHasher();
  const ana = await users.create({
    name: 'Ana',
    email: 'ana@example.com',
    passwordHash: 'fake:correct horse',
  });
  store.users.push({
    id: 'g1',
    name: 'Gil',
    email: 'gil@example.com',
    passwordHash: null,
    passwordClearedAt: null,
    passwordNotice: false,
  });
  const service = new SignInWithPasswordService({ users, rateLimiter, hasher });
  const signIn = (email: string, password: string, ipHash = 'h1') =>
    service.execute({ values: { email, password }, ipHash });
  return { service, signIn, verified, store, clock, ana };
}

describe('SignInWithPasswordService', () => {
  it('REQ-118: signs in with a normalized email and returns only id, name and email', async () => {
    const { signIn, ana } = await arrange();
    const user = await signIn(' ANA@example.com ', 'correct horse');
    expect(user).toEqual({ id: ana.id, name: 'Ana', email: 'ana@example.com' });
    expect(Object.keys(user).sort()).toEqual(['email', 'id', 'name']);
  });

  it('REQ-118: unknown email, wrong password and a Google-only account fail the same way', async () => {
    const { signIn } = await arrange();
    for (const [email, password] of [
      ['ana@example.com', 'wrong horse'],
      ['nobody@example.com', 'correct horse'],
      ['gil@example.com', 'correct horse'],
    ]) {
      const error = await signIn(email, password).catch((e: unknown) => e);
      expect(error, email).toBeInstanceOf(InvalidCredentialsError);
      expect(error).toMatchObject({ code: 'INVALID_CREDENTIALS', message: 'INVALID_CREDENTIALS' });
    }
  });

  it('REQ-118: without a usable password the dummy hash is still verified once', async () => {
    const { signIn, verified } = await arrange();
    await signIn('nobody@example.com', 'correct horse').catch(() => undefined);
    await signIn('gil@example.com', 'correct horse').catch(() => undefined);
    expect(verified).toEqual([
      { password: 'correct horse', stored: DUMMY_PASSWORD_HASH },
      { password: 'correct horse', stored: DUMMY_PASSWORD_HASH },
    ]);
  });

  it('REQ-118: invalid input fails without verifying or counting', async () => {
    const { signIn, verified, store } = await arrange();
    await expect(signIn('ana@example.com', '')).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(verified).toEqual([]);
    expect(store.rateLimits.size).toBe(0);
  });

  it('REQ-119: after 5 failures for an email even the right password is refused unchecked', async () => {
    const { signIn, verified } = await arrange();
    for (let i = 0; i < 5; i++) {
      await expect(signIn('ana@example.com', 'wrong horse')).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      );
    }
    await expect(signIn('ana@example.com', 'correct horse', 'h2')).rejects.toBeInstanceOf(
      RateLimitedError,
    );
    expect(verified).toHaveLength(5);
  });

  it('REQ-119: 20 failures from one IP block that IP only, and a new window allows again', async () => {
    const { signIn, clock } = await arrange();
    for (let i = 0; i < 20; i++) {
      await expect(signIn(`user${i}@example.com`, 'x')).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      );
    }
    await expect(signIn('ana@example.com', 'correct horse', 'h1')).rejects.toBeInstanceOf(
      RateLimitedError,
    );
    await expect(signIn('ana@example.com', 'correct horse', 'h2')).resolves.toMatchObject({
      name: 'Ana',
    });
    clock.now = new Date('2026-09-25T12:15:00.000Z');
    await expect(signIn('ana@example.com', 'correct horse', 'h1')).resolves.toMatchObject({
      name: 'Ana',
    });
  });

  it('REQ-119: successes are not counted and the counters keep only hashes', async () => {
    const { signIn, store } = await arrange();
    for (let i = 0; i < 10; i++) await signIn('ana@example.com', 'correct horse');
    expect(store.rateLimits.size).toBe(0);
    await expect(signIn('Ana@Example.com', 'wrong horse')).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
    expect([...store.rateLimits.keys()].sort()).toEqual([
      `signin-email:${hashToken('ana@example.com')}|2026-09-25T12:00:00.000Z`,
      'signin-ip:h1|2026-09-25T12:00:00.000Z',
    ]);
    expect([...store.rateLimits.keys()].some((key) => key.includes('@'))).toBe(false);
  });
});

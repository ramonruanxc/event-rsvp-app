import { describe, expect, it } from 'vitest';
import {
  EmailTakenError,
  GoogleAccountExistsError,
  RateLimitedError,
  ValidationError,
} from '@/domain/errors';
import { createMemoryRepositories } from '@/repositories/memory';
import { fakeHasher } from '@/test/fake-hasher';
import { RateLimiter } from './rate-limiter';
import { RegisterUserService } from './register-user';

const valid = {
  name: 'Ana Lima',
  email: '  Ana@Example.COM ',
  password: 'correct horse',
  confirmPassword: 'correct horse',
};

function arrange() {
  const { users, rateLimits, store } = createMemoryRepositories();
  const rateLimiter = new RateLimiter({
    repo: rateLimits,
    now: () => new Date('2026-09-25T12:00:00.000Z'),
  });
  const service = new RegisterUserService({ users, rateLimiter, hasher: fakeHasher().hasher });
  return { service, store };
}

describe('RegisterUserService', () => {
  it('REQ-116: creates the user with a normalized email and a hashed password', async () => {
    const { service, store } = arrange();
    const user = await service.execute({ values: valid, ipHash: 'h1' });
    expect(user).toEqual({ id: store.users[0].id, name: 'Ana Lima', email: 'ana@example.com' });
    expect(store.users).toEqual([
      {
        id: user.id,
        name: 'Ana Lima',
        email: 'ana@example.com',
        passwordHash: 'fake:correct horse',
        passwordClearedAt: null,
        passwordNotice: false,
      },
    ]);
  });

  it('REQ-116: invalid values are refused with field errors and nothing is stored or counted', async () => {
    const { service, store } = arrange();
    const error = await service
      .execute({ values: { ...valid, name: '', confirmPassword: 'other' }, ipHash: 'h1' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fieldErrors).toEqual({
      name: 'required',
      confirmPassword: 'passwordMismatch',
    });
    expect(store.users).toEqual([]);
    expect(store.rateLimits.size).toBe(0);
  });

  it('REQ-117: an email without a password (Google-only) is refused and left unchanged', async () => {
    const { service, store } = arrange();
    const gil = {
      id: 'g1',
      name: 'Gil',
      email: 'gil@example.com',
      passwordHash: null,
      passwordClearedAt: null,
      passwordNotice: false,
    };
    store.users.push({ ...gil });
    await expect(
      service.execute({ values: { ...valid, email: 'GIL@example.com' }, ipHash: 'h1' }),
    ).rejects.toBeInstanceOf(GoogleAccountExistsError);
    expect(store.users).toEqual([gil]);
  });

  it('REQ-117: an email with a password is refused as taken', async () => {
    const { service, store } = arrange();
    await service.execute({ values: valid, ipHash: 'h1' });
    await expect(
      service.execute({ values: { ...valid, name: 'Other' }, ipHash: 'h1' }),
    ).rejects.toBeInstanceOf(EmailTakenError);
    expect(store.users).toHaveLength(1);
    expect(store.users[0].name).toBe('Ana Lima');
  });

  it('REQ-119: refusals count against the IP, and a blocked IP cannot register', async () => {
    const { service, store } = arrange();
    await service.execute({ values: valid, ipHash: 'seed' });
    for (let i = 0; i < 20; i++) {
      await expect(service.execute({ values: valid, ipHash: 'h1' })).rejects.toBeInstanceOf(
        EmailTakenError,
      );
    }
    await expect(
      service.execute({ values: { ...valid, email: 'new@example.com' }, ipHash: 'h1' }),
    ).rejects.toBeInstanceOf(RateLimitedError);
    expect(store.users.map((u) => u.email)).toEqual(['ana@example.com']);
    await expect(
      service.execute({ values: { ...valid, email: 'new@example.com' }, ipHash: 'h2' }),
    ).resolves.toMatchObject({ email: 'new@example.com' });
  });
});

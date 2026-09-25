import { describe, expect, it, vi } from 'vitest';
import { createMemoryRepositories } from '@/repositories/memory';
import { LinkGoogleAccountService } from './link-google-account';
import { ValidatePasswordSessionService } from './validate-password-session';

const now = () => new Date('2026-09-25T12:00:00.000Z');

function arrange(passwordHash: string | null) {
  const { users, store } = createMemoryRepositories();
  store.users.push({
    id: 'u1',
    name: 'Ana',
    email: 'ana@example.com',
    passwordHash,
    passwordClearedAt: null,
    passwordNotice: false,
  });
  return { users, store };
}

describe('LinkGoogleAccountService', () => {
  it('REQ-122: linking Google to a password account clears the password and raises the notice', async () => {
    const { users, store } = arrange('fake:correct horse');
    expect(
      await new LinkGoogleAccountService({ users, now }).execute({
        userId: 'u1',
        provider: 'google',
      }),
    ).toBe(true);
    expect(store.users[0]).toMatchObject({
      passwordHash: null,
      passwordClearedAt: now(),
      passwordNotice: true,
    });
  });

  it('REQ-122: a user without a password, or another provider, is left unchanged', async () => {
    const google = arrange(null);
    expect(
      await new LinkGoogleAccountService({ users: google.users, now }).execute({
        userId: 'u1',
        provider: 'google',
      }),
    ).toBe(false);
    expect(google.store.users[0]).toMatchObject({ passwordClearedAt: null, passwordNotice: false });

    const other = arrange('fake:correct horse');
    const findById = vi.spyOn(other.users, 'findById');
    expect(
      await new LinkGoogleAccountService({ users: other.users, now }).execute({
        userId: 'u1',
        provider: 'github',
      }),
    ).toBe(false);
    expect(findById).not.toHaveBeenCalled();
    expect(other.store.users[0].passwordHash).toBe('fake:correct horse');
  });
});

describe('ValidatePasswordSessionService', () => {
  it('REQ-122: Google sessions are valid without a read; password sessions end once cleared', async () => {
    const { users, store } = arrange('fake:correct horse');
    const findById = vi.spyOn(users, 'findById');
    const service = new ValidatePasswordSessionService({ users });
    expect(await service.execute({ userId: 'u1', pwdAt: undefined })).toBe(true);
    expect(findById).not.toHaveBeenCalled();

    const pwdAt = now().getTime() - 60_000;
    expect(await service.execute({ userId: 'u1', pwdAt })).toBe(true);
    await new LinkGoogleAccountService({ users, now }).execute({
      userId: 'u1',
      provider: 'google',
    });
    expect(store.users[0].passwordHash).toBeNull();
    expect(await service.execute({ userId: 'u1', pwdAt })).toBe(false);
    expect(await service.execute({ userId: 'missing', pwdAt })).toBe(false);
  });
});

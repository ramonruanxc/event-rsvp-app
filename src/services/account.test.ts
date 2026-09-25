import { describe, expect, it } from 'vitest';
import { UnauthenticatedError } from '@/domain/errors';
import { createMemoryRepositories } from '@/repositories/memory';
import { DismissPasswordNoticeService } from './dismiss-password-notice';
import { GetAccountService } from './get-account';

function arrange() {
  const { users, store } = createMemoryRepositories();
  store.users.push({
    id: 'u1',
    name: 'Ana',
    email: 'ana@example.com',
    passwordHash: null,
    passwordClearedAt: new Date('2026-09-25T12:00:00.000Z'),
    passwordNotice: true,
  });
  return { users, store };
}

describe('account services', () => {
  it('REQ-123: GetAccountService returns email, password presence and the notice, never the hash', async () => {
    const { users, store } = arrange();
    const service = new GetAccountService({ users });
    expect(await service.execute({ userId: 'u1' })).toEqual({
      email: 'ana@example.com',
      hasPassword: false,
      passwordNotice: true,
    });
    store.users[0].passwordHash = 'fake:x';
    store.users[0].passwordNotice = false;
    expect(await service.execute({ userId: 'u1' })).toEqual({
      email: 'ana@example.com',
      hasPassword: true,
      passwordNotice: false,
    });
  });

  it('REQ-123: DismissPasswordNoticeService lowers the notice', async () => {
    const { users, store } = arrange();
    await new DismissPasswordNoticeService({ users }).execute({ userId: 'u1' });
    expect(store.users[0].passwordNotice).toBe(false);
  });

  it('REQ-123: both need a signed-in, existing user', async () => {
    const { users } = arrange();
    for (const userId of [null, 'missing']) {
      await expect(new GetAccountService({ users }).execute({ userId })).rejects.toBeInstanceOf(
        UnauthenticatedError,
      );
      await expect(
        new DismissPasswordNoticeService({ users }).execute({ userId }),
      ).rejects.toBeInstanceOf(UnauthenticatedError);
    }
  });
});

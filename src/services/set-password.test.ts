import { describe, expect, it } from 'vitest';
import { UnauthenticatedError, ValidationError } from '@/domain/errors';
import { createMemoryRepositories } from '@/repositories/memory';
import { fakeHasher } from '@/test/fake-hasher';
import { SetPasswordService } from './set-password';

const newValues = { newPassword: 'new horse 12', confirmPassword: 'new horse 12' };

function arrange(passwordHash: string | null, passwordNotice = false) {
  const { users, store } = createMemoryRepositories();
  store.users.push({
    id: 'u1',
    name: 'Ana',
    email: 'ana@example.com',
    passwordHash,
    passwordClearedAt: null,
    passwordNotice,
  });
  const service = new SetPasswordService({ users, hasher: fakeHasher().hasher });
  return { service, store };
}

async function fieldErrors(promise: Promise<unknown>) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ValidationError);
  return (error as ValidationError).fieldErrors;
}

describe('SetPasswordService', () => {
  it('REQ-120: a user without a password sets one and the notice goes down', async () => {
    const { service, store } = arrange(null, true);
    await service.execute({ userId: 'u1', values: { currentPassword: 'ignored', ...newValues } });
    expect(store.users[0]).toMatchObject({
      passwordHash: 'fake:new horse 12',
      passwordNotice: false,
    });
  });

  it('REQ-120: a user with a password must give the right current password', async () => {
    const { service, store } = arrange('fake:correct horse');
    expect(await fieldErrors(service.execute({ userId: 'u1', values: newValues }))).toEqual({
      currentPassword: 'required',
    });
    expect(
      await fieldErrors(
        service.execute({ userId: 'u1', values: { currentPassword: 'wrong', ...newValues } }),
      ),
    ).toEqual({ currentPassword: 'currentPasswordIncorrect' });
    expect(store.users[0].passwordHash).toBe('fake:correct horse');
    await service.execute({
      userId: 'u1',
      values: { currentPassword: 'correct horse', ...newValues },
    });
    expect(store.users[0].passwordHash).toBe('fake:new horse 12');
  });

  it('REQ-120: the new password follows the length and confirmation rules', async () => {
    const { service, store } = arrange(null);
    expect(
      await fieldErrors(
        service.execute({
          userId: 'u1',
          values: { newPassword: 'short', confirmPassword: 'other' },
        }),
      ),
    ).toEqual({ newPassword: 'passwordLength', confirmPassword: 'passwordMismatch' });
    expect(store.users[0].passwordHash).toBeNull();
  });

  it('REQ-120: needs a signed-in, existing user', async () => {
    const { service } = arrange(null);
    await expect(service.execute({ userId: null, values: newValues })).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
    await expect(service.execute({ userId: 'missing', values: newValues })).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });
});

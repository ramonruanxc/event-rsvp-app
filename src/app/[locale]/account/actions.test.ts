import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthenticatedError, ValidationError } from '@/domain/errors';

const mocks = vi.hoisted(() => ({
  userId: 'u1' as string | null,
  setPassword: vi.fn(),
  dismiss: vi.fn(),
}));
vi.mock('@/lib/session', () => ({ getCurrentUserId: async () => mocks.userId }));
vi.mock('@/lib/container', () => ({
  getServices: () => ({
    setPassword: { execute: mocks.setPassword },
    dismissPasswordNotice: { execute: mocks.dismiss },
  }),
}));

import { dismissPasswordNoticeAction, setPasswordAction } from './actions';

beforeEach(() => {
  mocks.userId = 'u1';
  mocks.setPassword.mockReset();
  mocks.dismiss.mockReset();
});

describe('account actions', () => {
  it('REQ-120: setPasswordAction passes the session user and the values', async () => {
    const values = { newPassword: 'new horse 12', confirmPassword: 'new horse 12' };
    expect(await setPasswordAction(values)).toEqual({ ok: true, data: null });
    expect(mocks.setPassword).toHaveBeenCalledWith({ userId: 'u1', values });
  });

  it('REQ-120: setPasswordAction returns field errors and UNAUTHENTICATED', async () => {
    mocks.setPassword.mockRejectedValueOnce(
      new ValidationError({ currentPassword: 'currentPasswordIncorrect' }),
    );
    expect(await setPasswordAction({})).toEqual({
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { currentPassword: 'currentPasswordIncorrect' },
    });
    mocks.userId = null;
    mocks.setPassword.mockRejectedValueOnce(new UnauthenticatedError());
    expect(await setPasswordAction({})).toEqual({ ok: false, code: 'UNAUTHENTICATED' });
    expect(mocks.setPassword).toHaveBeenLastCalledWith({ userId: null, values: {} });
  });

  it('REQ-123: dismissPasswordNoticeAction dismisses for the session user', async () => {
    expect(await dismissPasswordNoticeAction()).toEqual({ ok: true, data: null });
    expect(mocks.dismiss).toHaveBeenCalledWith({ userId: 'u1' });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CredentialsSignin } from 'next-auth';
import { EmailTakenError, GoogleAccountExistsError } from '@/domain/errors';
import { hashIp } from '@/lib/client-ip';

const mocks = vi.hoisted(() => ({ signIn: vi.fn(), register: vi.fn() }));
vi.mock('@/auth', () => ({ signIn: mocks.signIn, signOut: vi.fn() }));
vi.mock('@/lib/container', () => ({
  getServices: () => ({ registerUser: { execute: mocks.register } }),
}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.7' }),
}));

import { RateLimitedSignIn } from '@/lib/auth-callbacks';
import { registerAction, signInWithPasswordAction } from './actions';

const registration = {
  name: 'Ana Lima',
  email: ' Ana@Example.com ',
  password: 'correct horse',
  confirmPassword: 'correct horse',
};

beforeEach(() => {
  mocks.signIn.mockReset();
  mocks.register.mockReset();
  vi.stubEnv('AUTH_SECRET', 'test-secret');
});

describe('signInWithPasswordAction', () => {
  it('REQ-118: signs in with the normalized email, without redirect, and returns the safe callback', async () => {
    mocks.signIn.mockResolvedValue('http://localhost/');
    expect(
      await signInWithPasswordAction(
        { email: ' Ana@Example.com ', password: 'correct horse' },
        '/en/events/new',
      ),
    ).toEqual({ ok: true, data: { redirectTo: '/en/events/new' } });
    expect(mocks.signIn).toHaveBeenCalledWith('credentials', {
      email: 'ana@example.com',
      password: 'correct horse',
      redirect: false,
    });
    expect(
      await signInWithPasswordAction(
        { email: 'ana@example.com', password: 'x' },
        'https://evil.com',
      ),
    ).toEqual({
      ok: true,
      data: { redirectTo: '/' },
    });
  });

  it('REQ-118: invalid input returns field errors without calling Auth.js', async () => {
    expect(
      await signInWithPasswordAction({ email: 'nope', password: '' }, '/en/dashboard'),
    ).toEqual({
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { email: 'invalidEmail', password: 'required' },
    });
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it('REQ-118: a failed sign-in is INVALID_CREDENTIALS, a limited one RATE_LIMITED', async () => {
    mocks.signIn.mockRejectedValueOnce(new CredentialsSignin());
    expect(
      await signInWithPasswordAction({ email: 'ana@example.com', password: 'x' }, '/'),
    ).toEqual({
      ok: false,
      code: 'INVALID_CREDENTIALS',
    });
    mocks.signIn.mockRejectedValueOnce(new RateLimitedSignIn());
    expect(
      await signInWithPasswordAction({ email: 'ana@example.com', password: 'x' }, '/'),
    ).toEqual({
      ok: false,
      code: 'RATE_LIMITED',
    });
  });
});

describe('registerAction', () => {
  it('REQ-116: registers with the hashed IP, then signs in with the new credentials', async () => {
    mocks.register.mockResolvedValue({ id: 'u1', name: 'Ana Lima', email: 'ana@example.com' });
    mocks.signIn.mockResolvedValue('http://localhost/');
    expect(await registerAction(registration, '/en/dashboard')).toEqual({
      ok: true,
      data: { redirectTo: '/en/dashboard' },
    });
    expect(mocks.register).toHaveBeenCalledWith({
      values: registration,
      ipHash: hashIp('203.0.113.7', 'test-secret'),
    });
    expect(mocks.signIn).toHaveBeenCalledWith('credentials', {
      email: 'ana@example.com',
      password: 'correct horse',
      redirect: false,
    });
  });

  it('REQ-116: invalid registration returns field errors without calling the service', async () => {
    expect(
      await registerAction(
        { ...registration, name: '', password: 'short', confirmPassword: 'short' },
        '/',
      ),
    ).toEqual({
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { name: 'required', password: 'passwordLength' },
    });
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it('REQ-117: a refused email returns its code and nobody is signed in', async () => {
    mocks.register.mockRejectedValueOnce(new GoogleAccountExistsError());
    expect(await registerAction(registration, '/')).toEqual({
      ok: false,
      code: 'GOOGLE_ACCOUNT_EXISTS',
    });
    mocks.register.mockRejectedValueOnce(new EmailTakenError());
    expect(await registerAction(registration, '/')).toEqual({ ok: false, code: 'EMAIL_TAKEN' });
    expect(mocks.signIn).not.toHaveBeenCalled();
  });
});

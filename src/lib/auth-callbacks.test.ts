import { describe, expect, it, vi } from 'vitest';
import { CredentialsSignin } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { EmailTakenError, InvalidCredentialsError, RateLimitedError } from '@/domain/errors';
import { hashIp } from './client-ip';
import {
  createAuthCallbacks,
  RateLimitedSignIn,
  signInFailure,
  type AuthCallbackDeps,
} from './auth-callbacks';

const ana = { id: 'u1', name: 'Ana', email: 'ana@example.com' };
const request = new Request('http://localhost/api/auth/callback/credentials', {
  headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
});

/** Fake dependencies; every function is a vi.fn so calls can be checked. */
function deps(overrides: Partial<AuthCallbackDeps> = {}) {
  return {
    signInWithPassword: vi.fn(async () => ana),
    validatePasswordSession: vi.fn(async () => true),
    ipSalt: () => 'salt',
    now: () => 1_790_000_000_000,
    linkGoogleAccount: vi.fn(async () => false),
    currentSessionEmail: vi.fn(async (): Promise<string | null> => null),
    ...overrides,
  } satisfies AuthCallbackDeps;
}

describe('authorize', () => {
  it('REQ-118: authorize signs in with the salted IP hash and returns only the user', async () => {
    const d = deps();
    const user = await createAuthCallbacks(d).authorize(
      { email: 'ana@example.com', password: 'correct horse', csrfToken: 'x' },
      request,
    );
    expect(user).toEqual(ana);
    expect(d.signInWithPassword).toHaveBeenCalledWith({
      values: { email: 'ana@example.com', password: 'correct horse' },
      ipHash: hashIp('203.0.113.7', 'salt'),
    });
  });

  it('REQ-118: wrong credentials become null, which Auth.js reports as CredentialsSignin', async () => {
    const d = deps({
      signInWithPassword: vi.fn(async () => Promise.reject(new InvalidCredentialsError())),
    });
    expect(
      await createAuthCallbacks(d).authorize({ email: 'a@b.co', password: 'x' }, request),
    ).toBeNull();
  });

  it('REQ-119: the rate limit becomes RateLimitedSignIn; unexpected errors are rethrown', async () => {
    const limited = deps({
      signInWithPassword: vi.fn(async () => Promise.reject(new RateLimitedError())),
    });
    const error = await createAuthCallbacks(limited)
      .authorize({}, request)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RateLimitedSignIn);
    expect(error).toBeInstanceOf(CredentialsSignin);
    expect((error as RateLimitedSignIn).code).toBe('rate_limited');

    const boom = new Error('db down');
    const broken = deps({ signInWithPassword: vi.fn(async () => Promise.reject(boom)) });
    await expect(createAuthCallbacks(broken).authorize({}, request)).rejects.toBe(boom);
  });
});

describe('jwt', () => {
  it('REQ-122: a credentials sign-in stamps pwdAt; a Google sign-in does not', async () => {
    const { jwt } = createAuthCallbacks(deps());
    expect(
      await jwt({ token: { sub: 'u1' }, account: { provider: 'credentials' }, trigger: 'signIn' }),
    ).toEqual({
      sub: 'u1',
      pwdAt: 1_790_000_000_000,
    });
    expect(
      await jwt({ token: { sub: 'u1' }, account: { provider: 'google' }, trigger: 'signUp' }),
    ).toEqual({
      sub: 'u1',
    });
  });

  it('REQ-122: later calls re-check password sessions only, and end them when invalid', async () => {
    const token: JWT = { sub: 'u1', pwdAt: 1_789_000_000_000 };
    const valid = deps();
    expect(await createAuthCallbacks(valid).jwt({ token })).toBe(token);
    expect(valid.validatePasswordSession).toHaveBeenCalledWith({
      userId: 'u1',
      pwdAt: 1_789_000_000_000,
    });

    const google = deps();
    expect(await createAuthCallbacks(google).jwt({ token: { sub: 'u2' } })).toEqual({ sub: 'u2' });
    expect(google.validatePasswordSession).not.toHaveBeenCalled();

    const cleared = deps({ validatePasswordSession: vi.fn(async () => false) });
    expect(await createAuthCallbacks(cleared).jwt({ token })).toBeNull();
    expect(await createAuthCallbacks(deps()).jwt({ token: { pwdAt: 1 } })).toBeNull();
  });
});

describe('Google sign-in', () => {
  it('REQ-121: other providers pass without reading the session', async () => {
    const d = deps();
    expect(await createAuthCallbacks(d).signIn({ account: { provider: 'credentials' } })).toBe(
      true,
    );
    expect(d.currentSessionEmail).not.toHaveBeenCalled();
  });

  it('REQ-121: Google passes only with a verified email matching the current session', async () => {
    const google = { provider: 'google' };
    const verified = { email: 'ana@example.com', email_verified: true };
    expect(await createAuthCallbacks(deps()).signIn({ account: google, profile: verified })).toBe(
      true,
    );
    expect(
      await createAuthCallbacks(deps()).signIn({
        account: google,
        profile: { ...verified, email_verified: false },
      }),
    ).toBe(false);
    const same = deps({ currentSessionEmail: vi.fn(async () => 'Ana@Example.com') });
    expect(await createAuthCallbacks(same).signIn({ account: google, profile: verified })).toBe(
      true,
    );
    const other = deps({ currentSessionEmail: vi.fn(async () => 'bob@example.com') });
    expect(await createAuthCallbacks(other).signIn({ account: google, profile: verified })).toBe(
      false,
    );
  });

  it('REQ-122: linkAccount hands the user and the provider to the linking service', async () => {
    const d = deps();
    await createAuthCallbacks(d).linkAccount({
      user: { id: 'u1' },
      account: { provider: 'google' },
    });
    expect(d.linkGoogleAccount).toHaveBeenCalledWith({ userId: 'u1', provider: 'google' });
    await createAuthCallbacks(d).linkAccount({ user: {}, account: { provider: 'google' } });
    expect(d.linkGoogleAccount).toHaveBeenCalledTimes(1);
  });
});

describe('signInFailure', () => {
  it('REQ-118: maps sign-in failures to action results', () => {
    const log = vi.fn();
    expect(signInFailure(new CredentialsSignin(), log)).toEqual({
      ok: false,
      code: 'INVALID_CREDENTIALS',
    });
    expect(signInFailure(new RateLimitedSignIn(), log)).toEqual({
      ok: false,
      code: 'RATE_LIMITED',
    });
    expect(signInFailure(new EmailTakenError(), log)).toEqual({ ok: false, code: 'EMAIL_TAKEN' });
    expect(signInFailure(new Error('boom'), log)).toEqual({ ok: false, code: 'INTERNAL_ERROR' });
    expect(log).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, it } from 'vitest';
import { authConfig } from './auth.config';

describe('authConfig', () => {
  it('REQ-01: Google links verified emails and sessions are JWTs', () => {
    expect(authConfig.providers).toHaveLength(1);
    const google = authConfig.providers[0] as unknown as {
      id: string;
      options?: { allowDangerousEmailAccountLinking?: boolean };
    };
    expect(google.id).toBe('google');
    expect(google.options?.allowDangerousEmailAccountLinking).toBe(true);
    expect(authConfig.session.strategy).toBe('jwt');
  });

  it('REQ-124: the session exposes the user id from the token subject', async () => {
    const session = await authConfig.callbacks.session({
      session: {
        user: { id: '', name: 'Ana', email: 'ana@example.com' },
        expires: '2026-10-25T00:00:00.000Z',
      },
      token: { sub: 'u1' },
    } as never);
    expect(session).toEqual({
      user: { id: 'u1', name: 'Ana', email: 'ana@example.com' },
      expires: '2026-10-25T00:00:00.000Z',
    });
  });

  it('REQ-126: Auth.js sends its sign-in and error pages to /sign-in', () => {
    expect(authConfig.pages).toEqual({ signIn: '/sign-in', error: '/sign-in' });
  });
});

import { CredentialsSignin } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { InvalidCredentialsError, RateLimitedError } from '@/domain/errors';
import type { AuthUser } from '@/domain/types';
import { clientIp, hashIp } from './client-ip';
import type { ActionFailure } from './action-result';
import { toActionError } from './action-result';

/** Thrown by authorize when the sign-in rate limit is reached (REQ-119). */
export class RateLimitedSignIn extends CredentialsSignin {
  code = 'rate_limited';
}

/** What the Auth.js callbacks need from the application (wired in src/auth.ts). */
export interface AuthCallbackDeps {
  signInWithPassword: (input: { values: unknown; ipHash: string }) => Promise<AuthUser>;
  validatePasswordSession: (input: { userId: string; pwdAt: unknown }) => Promise<boolean>;
  ipSalt: () => string; // AUTH_SECRET
  now: () => number; // Date.now in production
  linkGoogleAccount: (input: { userId: string; provider: string }) => Promise<boolean>; // TASK-259
  currentSessionEmail: () => Promise<string | null>; // TASK-259
}

/** Auth.js callbacks for credentials sign-in, password sessions and Google linking. */
export interface AuthCallbacks {
  authorize(
    credentials: Partial<Record<string, unknown>>,
    request: Request,
  ): Promise<AuthUser | null>;
  jwt(params: {
    token: JWT;
    account?: { provider: string } | null;
    trigger?: 'signIn' | 'signUp' | 'update';
  }): Promise<JWT | null>;
  signIn(params: {
    account?: { provider: string } | null;
    profile?: { email?: string | null; email_verified?: unknown };
  }): Promise<boolean>; // TASK-259
  linkAccount(message: { user: { id?: string }; account: { provider: string } }): Promise<void>; // TASK-259
}

/** Builds the Auth.js callbacks from application services (REQ-118, REQ-119, REQ-121, REQ-122). */
export function createAuthCallbacks(deps: AuthCallbackDeps): AuthCallbacks {
  return {
    async authorize(credentials, request) {
      const ipHash = hashIp(clientIp(request.headers), deps.ipSalt());
      try {
        return await deps.signInWithPassword({
          values: { email: credentials.email, password: credentials.password },
          ipHash,
        });
      } catch (error) {
        if (error instanceof RateLimitedError) throw new RateLimitedSignIn();
        if (error instanceof InvalidCredentialsError) return null;
        throw error;
      }
    },
    async jwt({ token, account, trigger }) {
      if (trigger === 'signIn' || trigger === 'signUp') {
        if (account?.provider === 'credentials') token.pwdAt = deps.now();
        return token;
      }
      if (typeof token.pwdAt !== 'number') return token;
      if (!token.sub) return null;
      return (await deps.validatePasswordSession({ userId: token.sub, pwdAt: token.pwdAt }))
        ? token
        : null;
    },
    async signIn() {
      throw new Error('not implemented');
    },
    async linkAccount() {
      throw new Error('not implemented');
    },
  };
}

/** Maps a server-side signIn failure to an ActionFailure (REQ-118, REQ-119). */
export function signInFailure(error: unknown, log?: (error: unknown) => void): ActionFailure {
  if (error instanceof CredentialsSignin) {
    return {
      ok: false,
      code: error.code === 'rate_limited' ? 'RATE_LIMITED' : 'INVALID_CREDENTIALS',
    };
  }
  return toActionError(error, log);
}

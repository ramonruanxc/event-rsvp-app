import { CredentialsSignin } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { ActionFailure } from './action-result';
import type { AuthUser } from '@/domain/types';

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
export function createAuthCallbacks(_deps: AuthCallbackDeps): AuthCallbacks {
  return {
    authorize: async () => {
      throw new Error('not implemented');
    },
    jwt: async () => {
      throw new Error('not implemented');
    },
    signIn: async () => {
      throw new Error('not implemented');
    },
    linkAccount: async () => {
      throw new Error('not implemented');
    },
  };
}

/** Maps a server-side signIn failure to an ActionFailure (REQ-118, REQ-119). */
export function signInFailure(_error: unknown, _log?: (error: unknown) => void): ActionFailure {
  throw new Error('not implemented');
}

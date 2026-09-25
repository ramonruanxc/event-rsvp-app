import NextAuth, { type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { getServices } from '@/lib/container';
import { createAuthCallbacks } from '@/lib/auth-callbacks';
import { authConfig } from './auth.config';

/** Reads the current session; pointed at `auth` below, once NextAuth exists (used by the Google check, REQ-121). */
let currentSession: () => Promise<Session | null> = async () => null;

const callbacks = createAuthCallbacks({
  signInWithPassword: (input) => getServices().signInWithPassword.execute(input),
  validatePasswordSession: (input) => getServices().validatePasswordSession.execute(input),
  linkGoogleAccount: (input) => getServices().linkGoogleAccount.execute(input),
  currentSessionEmail: async () => (await currentSession())?.user?.email ?? null,
  ipSalt: () => process.env.AUTH_SECRET ?? '',
  now: () => Date.now(),
});

/** Auth.js instance: Google and email/password, JWT sessions, users and accounts in PostgreSQL (REQ-01, REQ-124). */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    Credentials({ credentials: { email: {}, password: {} }, authorize: callbacks.authorize }),
  ],
  callbacks: { ...authConfig.callbacks, jwt: callbacks.jwt },
});

currentSession = () => auth();

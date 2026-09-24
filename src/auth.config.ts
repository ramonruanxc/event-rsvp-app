import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

/** Auth.js settings shared by the app: Google only, database sessions. */
export const authConfig = {
  providers: [Google],
  session: { strategy: 'database' },
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
} satisfies NextAuthConfig;

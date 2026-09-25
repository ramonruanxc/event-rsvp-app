import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Auth.js settings shared by the app and safe for the Edge (no Prisma, no node:crypto): Google, which may link a
 * verified email to an existing user (REQ-121), and JWT sessions carrying the user id (REQ-01, REQ-124).
 */
export const authConfig = {
  providers: [Google({ allowDangerousEmailAccountLinking: true })],
  session: { strategy: 'jwt' },
  trustHost: true,
  callbacks: {
    session({ session, token }) {
      if (token?.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;

import type { NextAuthConfig } from 'next-auth';

/** Auth.js settings shared by the app: Google only, database sessions. */
export const authConfig = {
  providers: [],
} as unknown as NextAuthConfig;

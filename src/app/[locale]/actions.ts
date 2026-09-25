'use server';

import { signOut } from '@/auth';

/** Signs the current user out and returns to the given locale's home page (REQ-54). */
export async function signOutAction(locale: string): Promise<void> {
  await signOut({ redirectTo: `/${locale}` });
}

/** Signs in with email and password and returns where to go next (REQ-118, REQ-119). */
export async function signInWithPasswordAction(): Promise<never> {
  throw new Error('not implemented');
}

/** Registers a password account and signs it in at once (REQ-116, REQ-117). */
export async function registerAction(): Promise<never> {
  throw new Error('not implemented');
}

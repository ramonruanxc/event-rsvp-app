'use server';

import { signOut } from '@/auth';

/** Signs the current user out and returns to the given locale's home page (REQ-54). */
export async function signOutAction(locale: string): Promise<void> {
  await signOut({ redirectTo: `/${locale}` });
}

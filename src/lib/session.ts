import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { signInRedirectPath } from './auth-redirect';

/** Id of the signed-in user, or null. */
export async function getCurrentUserId(): Promise<string | null> {
  const s = await auth();
  return s?.user?.id ?? null;
}

/** Returns the signed-in user id or redirects to Google sign-in, coming back to `pathname`. */
export async function requireUserId(pathname: string): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) redirect(signInRedirectPath(pathname));
  return id;
}

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { signInRedirectPath } from './auth-redirect';

/** Id of the signed-in user, or null. */
export async function getCurrentUserId(): Promise<string | null> {
  const s = await auth();
  return s?.user?.id ?? null;
}

/** The signed-in user's id, name and email, as read from the session. */
export interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
}

/** The signed-in user, or null (REQ-80). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const s = await auth();
  if (!s?.user?.id) return null;
  return { id: s.user.id, name: s.user.name ?? null, email: s.user.email ?? null };
}

/** Returns the signed-in user id or redirects to Google sign-in, coming back to `pathname`. */
export async function requireUserId(pathname: string): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) redirect(signInRedirectPath(pathname));
  return id;
}

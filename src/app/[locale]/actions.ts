'use server';

import { headers } from 'next/headers';
import { signIn, signOut } from '@/auth';
import { ValidationError } from '@/domain/errors';
import { registerInputSchema, signInInputSchema } from '@/domain/schemas';
import { signInFailure } from '@/lib/auth-callbacks';
import { sanitizeCallbackUrl } from '@/lib/auth-redirect';
import { clientIp, hashIp } from '@/lib/client-ip';
import { getServices } from '@/lib/container';
import { toActionError, type ActionResult } from '@/lib/action-result';

/** Signs the current user out and returns to the given locale's home page (REQ-54). */
export async function signOutAction(locale: string): Promise<void> {
  await signOut({ redirectTo: `/${locale}` });
}

/** Signs in with email and password and returns where to go next (REQ-118, REQ-119). */
export async function signInWithPasswordAction(
  values: unknown,
  callbackUrl: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = signInInputSchema.safeParse(values);
  if (!parsed.success) return toActionError(ValidationError.fromZod(parsed.error));
  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true, data: { redirectTo: sanitizeCallbackUrl(callbackUrl) } };
  } catch (error) {
    return signInFailure(error);
  }
}

/** Registers a password account and signs it in at once (REQ-116, REQ-117). */
export async function registerAction(
  values: unknown,
  callbackUrl: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = registerInputSchema.safeParse(values);
  if (!parsed.success) return toActionError(ValidationError.fromZod(parsed.error));
  const ipHash = hashIp(clientIp(await headers()), process.env.AUTH_SECRET ?? '');
  try {
    const user = await getServices().registerUser.execute({ values, ipHash });
    await signIn('credentials', {
      email: user.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true, data: { redirectTo: sanitizeCallbackUrl(callbackUrl) } };
  } catch (error) {
    return signInFailure(error);
  }
}

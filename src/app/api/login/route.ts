import { signIn } from '@/auth';
import { sanitizeCallbackUrl } from '@/lib/auth-redirect';

/** Starts Google sign-in and returns to the (local) callbackUrl afterwards. */
export async function GET(request: Request) {
  const callbackUrl = new URL(request.url).searchParams.get('callbackUrl');
  await signIn('google', { redirectTo: sanitizeCallbackUrl(callbackUrl) });
}

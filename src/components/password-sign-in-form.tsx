'use client';

import type { SignInFormValues } from '@/domain/schemas';
import type { ActionResult } from '@/lib/action-result';

/** Props of {@link PasswordSignInForm}. */
export interface PasswordSignInFormProps {
  callbackUrl: string;
  submit: (
    values: SignInFormValues,
    callbackUrl: string,
  ) => Promise<ActionResult<{ redirectTo: string }>>;
  navigate?: (url: string) => void;
}

/** Email/password sign-in form (REQ-126, REQ-118, REQ-119). */
export function PasswordSignInForm(_props: PasswordSignInFormProps): React.JSX.Element {
  throw new Error('not implemented');
}

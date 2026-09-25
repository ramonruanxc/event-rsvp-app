'use client';

import type { RegisterFormValues } from '@/domain/schemas';
import type { ActionResult } from '@/lib/action-result';

/** Props of {@link RegisterForm}. */
export interface RegisterFormProps {
  callbackUrl: string;
  submit: (
    values: RegisterFormValues,
    callbackUrl: string,
  ) => Promise<ActionResult<{ redirectTo: string }>>;
  navigate?: (url: string) => void;
}

/** Registration form: name, email, password and confirm password (REQ-127, REQ-116, REQ-117). */
export function RegisterForm(_props: RegisterFormProps): React.JSX.Element {
  throw new Error('not implemented');
}

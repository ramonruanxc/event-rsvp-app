'use client';

import type { SetPasswordFormValues } from '@/domain/schemas';
import type { ActionResult } from '@/lib/action-result';

/** Props of {@link SetPasswordForm}. */
export interface SetPasswordFormProps {
  hasPassword: boolean;
  submit: (values: SetPasswordFormValues) => Promise<ActionResult<null>>;
}

/** Sets or changes the signed-in user's password (REQ-128, REQ-120). */
export function SetPasswordForm({}: SetPasswordFormProps): React.JSX.Element {
  throw new Error('not implemented');
}

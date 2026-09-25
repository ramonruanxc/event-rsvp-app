'use client';

import type { ActionResult } from '@/lib/action-result';

/** Props of {@link PasswordNotice}. */
export interface PasswordNoticeProps {
  dismiss: () => Promise<ActionResult<null>>;
}

/** Explains a Google-link password clearing and lets the user dismiss the notice (REQ-123). */
export function PasswordNotice({}: PasswordNoticeProps): React.JSX.Element | null {
  throw new Error('not implemented');
}

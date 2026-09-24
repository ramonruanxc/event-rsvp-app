'use client';

import type { ActionResult } from '@/lib/action-result';

/** Props of {@link RemoveRsvpButton}. */
export interface RemoveRsvpButtonProps {
  removeAction: () => Promise<ActionResult<null>>;
}

/** Button that removes one RSVP row from the owner's guest list (REQ-30). */
export function RemoveRsvpButton(_props: RemoveRsvpButtonProps) {
  throw new Error('not implemented');
}

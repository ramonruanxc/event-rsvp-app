'use client';

import type { ActionResult } from '@/lib/action-result';

/** Props of {@link DeleteEventButton}. */
export interface DeleteEventButtonProps {
  deleteAction: () => Promise<ActionResult<null>>;
}

/** Button that deletes the event after a native confirmation dialog (REQ-19). */
export function DeleteEventButton(_props: DeleteEventButtonProps) {
  throw new Error('not implemented');
}

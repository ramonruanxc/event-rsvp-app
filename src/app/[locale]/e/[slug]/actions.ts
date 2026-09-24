'use server';

import type { ActionResult } from '@/lib/action-result';

/** Deletes an event; only its owner may delete it, even after it has ended (REQ-18). */
export async function deleteEventAction(_slug: string): Promise<ActionResult<null>> {
  throw new Error('not implemented');
}

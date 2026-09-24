'use server';

import type { ActionResult } from '@/lib/action-result';

/** Creates a new event owned by the signed-in user (REQ-15). */
export async function createEventAction(
  _values: unknown,
): Promise<ActionResult<{ slug: string }>> {
  throw new Error('not implemented');
}

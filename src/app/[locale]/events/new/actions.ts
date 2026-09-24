'use server';

import { getServices } from '@/lib/container';
import { getCurrentUserId } from '@/lib/session';
import { toActionError, type ActionResult } from '@/lib/action-result';

/** Creates a new event owned by the signed-in user (REQ-15). */
export async function createEventAction(values: unknown): Promise<ActionResult<{ slug: string }>> {
  const ownerId = await getCurrentUserId();
  if (!ownerId) return { ok: false, code: 'UNAUTHENTICATED' };

  try {
    const event = await getServices().createEvent.execute({ ownerId, values });
    return { ok: true, data: { slug: event.slug } };
  } catch (error) {
    return toActionError(error);
  }
}

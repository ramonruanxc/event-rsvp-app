'use server';

import type { OwnRsvp } from '@/domain/types';
import { getServices } from '@/lib/container';
import { getCurrentUserId } from '@/lib/session';
import { toActionError, type ActionResult } from '@/lib/action-result';

/** Deletes an event; only its owner may delete it, even after it has ended (REQ-18). */
export async function deleteEventAction(slug: string): Promise<ActionResult<null>> {
  const userId = await getCurrentUserId();
  try {
    await getServices().deleteEvent.execute({ userId, slug });
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

/** Updates an event; only its owner may edit it, and only before it starts (REQ-17). */
export async function updateEventAction(
  slug: string,
  values: unknown,
): Promise<ActionResult<{ slug: string }>> {
  const userId = await getCurrentUserId();
  try {
    const event = await getServices().updateEvent.execute({ userId, slug, values });
    return { ok: true, data: { slug: event.slug } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Creates or edits the caller's own RSVP for an event (REQ-23, REQ-24, REQ-25, REQ-26, REQ-29). */
export async function submitRsvpAction(
  _locale: string,
  _slug: string,
  _values: unknown,
  _honeypot: string,
): Promise<ActionResult<OwnRsvp>> {
  throw new Error('not implemented');
}

/** Sets the caller's own RSVP to Not going (REQ-28, REQ-29). */
export async function cancelRsvpAction(
  _locale: string,
  _slug: string,
): Promise<ActionResult<OwnRsvp>> {
  throw new Error('not implemented');
}

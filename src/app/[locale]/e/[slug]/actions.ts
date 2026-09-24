'use server';

import { headers, cookies } from 'next/headers';
import type { OwnRsvp } from '@/domain/types';
import { clientIp, hashIp } from '@/lib/client-ip';
import { getServices } from '@/lib/container';
import { getCurrentUserId } from '@/lib/session';
import { toActionError, type ActionResult } from '@/lib/action-result';
import { editTokenCookieName, editTokenCookies } from '@/lib/edit-token-cookie';

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
  locale: string,
  slug: string,
  values: unknown,
  honeypot: string,
): Promise<ActionResult<OwnRsvp>> {
  const store = await cookies();
  const editToken = store.get(editTokenCookieName(locale))?.value ?? null;
  const ipHash = hashIp(clientIp(await headers()), process.env.AUTH_SECRET ?? '');
  try {
    const result = await getServices().submitRsvp.execute({
      slug,
      values,
      editToken,
      ipHash,
      honeypot,
    });
    for (const cookie of editTokenCookies(slug, result.editToken, result.cookieExpires)) {
      store.set(cookie);
    }
    return { ok: true, data: result.rsvp };
  } catch (error) {
    return toActionError(error);
  }
}

/** Sets the caller's own RSVP to Not going (REQ-28, REQ-29). */
export async function cancelRsvpAction(
  locale: string,
  slug: string,
): Promise<ActionResult<OwnRsvp>> {
  const store = await cookies();
  const editToken = store.get(editTokenCookieName(locale))?.value ?? null;
  try {
    const data = await getServices().cancelRsvp.execute({ slug, editToken });
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

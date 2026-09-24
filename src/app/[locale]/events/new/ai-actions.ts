'use server';

import { getServices } from '@/lib/container';
import { getCurrentUserId } from '@/lib/session';
import { toActionError, type ActionResult } from '@/lib/action-result';
import type { ParseEventResult } from '@/lib/ai/types';

/** Parses organizer text into event fields for the signed-in user (REQ-49). */
export async function parseEventTextAction(
  text: string,
  timezone: string | null,
): Promise<ActionResult<ParseEventResult>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, code: 'UNAUTHENTICATED' };

  try {
    const data = await getServices().parseEventText.execute({ userId, text, timezone });
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

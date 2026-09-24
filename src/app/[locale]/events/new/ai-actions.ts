'use server';

import type { ParseEventResult } from '@/lib/ai/types';
import type { ActionResult } from '@/lib/action-result';

/** Parses organizer text into event fields for the signed-in user (REQ-49). */
export async function parseEventTextAction(
  _text: string,
  _timezone: string | null,
): Promise<ActionResult<ParseEventResult>> {
  throw new Error('not implemented');
}

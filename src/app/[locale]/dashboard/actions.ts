'use server';

import { getTranslations } from 'next-intl/server';
import { getServices } from '@/lib/container';
import { getCurrentUserId } from '@/lib/session';
import { toActionError, type ActionResult } from '@/lib/action-result';

/** Creates the sample event for the signed-in organizer, pre-filled from translations (REQ-37). */
export async function createSampleEventAction(
  timezone: string,
): Promise<ActionResult<{ slug: string }>> {
  const ownerId = await getCurrentUserId();
  if (!ownerId) return { ok: false, code: 'UNAUTHENTICATED' };

  const t = await getTranslations('sample');
  try {
    const event = await getServices().createSampleEvent.execute({
      ownerId,
      timezone,
      content: { name: t('name'), description: t('description'), location: t('location') },
    });
    return { ok: true, data: { slug: event.slug } };
  } catch (error) {
    return toActionError(error);
  }
}

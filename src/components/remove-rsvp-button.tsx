'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { ActionResult } from '@/lib/action-result';

/** Props of {@link RemoveRsvpButton}. */
export interface RemoveRsvpButtonProps {
  removeAction: () => Promise<ActionResult<null>>;
}

/** Button that removes one RSVP row from the owner's guest list (REQ-30). */
export function RemoveRsvpButton({ removeAction }: RemoveRsvpButtonProps) {
  const t = useTranslations();
  const router = useRouter();

  async function handleClick() {
    await removeAction();
    router.refresh();
  }

  return <button onClick={handleClick}>{t('event.remove')}</button>;
}

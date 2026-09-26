'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { ActionResult } from '@/lib/action-result';
import type { ErrorCode } from '@/domain/errors';
import { InlineConfirm } from '@/components/ui/inline-confirm';

/** Props of {@link RemoveRsvpButton}. */
export interface RemoveRsvpButtonProps {
  name: string;
  removeAction: () => Promise<ActionResult<null>>;
}

/** Button that removes one RSVP row from the owner's guest list, after an inline confirmation (REQ-30, REQ-72). */
export function RemoveRsvpButton({ name, removeAction }: RemoveRsvpButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [error, setError] = useState<ErrorCode | null>(null);

  async function handleConfirm() {
    setError(null);
    const result = await removeAction();
    if (!result.ok) {
      setError(result.code); // REQ-142
      return;
    }
    document.getElementById('guest-list-heading')?.focus(); // REQ-140: the row is about to go
    router.refresh();
  }

  return (
    <InlineConfirm
      layout="row"
      triggerLabel={t('event.remove')}
      triggerAriaLabel={t('event.removeNamed', { name })}
      question={t('event.removeConfirm', { name })}
      confirmLabel={t('event.remove')}
      cancelLabel={t('event.keep')}
      onConfirm={handleConfirm}
      error={error ? t(`errors.${error}`) : null}
    />
  );
}

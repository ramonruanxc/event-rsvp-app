'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { ActionResult } from '@/lib/action-result';
import type { ErrorCode } from '@/domain/errors';
import { InlineConfirm } from '@/components/ui/inline-confirm';

/** Props of {@link DeleteEventButton}. */
export interface DeleteEventButtonProps {
  deleteAction: () => Promise<ActionResult<null>>;
}

/** Button that deletes the event after an inline confirmation (REQ-19, REQ-72). */
export function DeleteEventButton({ deleteAction }: DeleteEventButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [error, setError] = useState<ErrorCode | null>(null);

  async function handleConfirm() {
    setError(null);
    const result = await deleteAction();
    if (result.ok) router.push('/dashboard');
    else setError(result.code); // REQ-142
  }

  return (
    <InlineConfirm
      triggerLabel={t('event.delete')}
      question={t('event.deleteConfirm')}
      confirmLabel={t('event.deleteConfirmAction')}
      cancelLabel={t('event.keep')}
      onConfirm={handleConfirm}
      error={error ? t(`errors.${error}`) : null}
    />
  );
}

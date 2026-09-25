'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { ActionResult } from '@/lib/action-result';
import { InlineConfirm } from '@/components/ui/inline-confirm';

/** Props of {@link DeleteEventButton}. */
export interface DeleteEventButtonProps {
  deleteAction: () => Promise<ActionResult<null>>;
}

/** Button that deletes the event after an inline confirmation (REQ-19, REQ-72). */
export function DeleteEventButton({ deleteAction }: DeleteEventButtonProps) {
  const t = useTranslations();
  const router = useRouter();

  async function handleConfirm() {
    const result = await deleteAction();
    if (result.ok) router.push('/dashboard');
  }

  return (
    <InlineConfirm
      triggerLabel={t('event.delete')}
      question={t('event.deleteConfirm')}
      confirmLabel={t('event.deleteConfirmAction')}
      cancelLabel={t('event.keep')}
      onConfirm={handleConfirm}
    />
  );
}

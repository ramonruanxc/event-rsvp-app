'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { ActionResult } from '@/lib/action-result';

/** Props of {@link DeleteEventButton}. */
export interface DeleteEventButtonProps {
  deleteAction: () => Promise<ActionResult<null>>;
}

/** Button that deletes the event after a native confirmation dialog (REQ-19). */
export function DeleteEventButton({ deleteAction }: DeleteEventButtonProps) {
  const t = useTranslations();
  const router = useRouter();

  async function handleClick() {
    if (!window.confirm(t('event.deleteConfirm'))) return;
    const result = await deleteAction();
    if (result.ok) {
      router.push('/dashboard');
    }
  }

  return <button onClick={handleClick}>{t('event.delete')}</button>;
}

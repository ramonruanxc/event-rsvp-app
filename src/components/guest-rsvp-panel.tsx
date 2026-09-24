'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { ErrorCode } from '@/domain/errors';
import type { OwnRsvp } from '@/domain/types';
import type { ActionResult } from '@/lib/action-result';
import { RsvpForm, type RsvpFormProps } from './rsvp-form';

/** Props of {@link GuestRsvpPanel}. */
export interface GuestRsvpPanelProps {
  ownRsvp: OwnRsvp | null;
  ended: boolean;
  submit: RsvpFormProps['submit'];
  cancel: () => Promise<ActionResult<OwnRsvp>>;
}

/**
 * A guest's view of their own RSVP: status line with Change/Cancel, the form when there is
 * no RSVP yet or while editing, and a read-only notice once the event has ended (REQ-31).
 */
export function GuestRsvpPanel({ ownRsvp, ended, submit, cancel }: GuestRsvpPanelProps) {
  const t = useTranslations();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [cancelError, setCancelError] = useState<ErrorCode | null>(null);

  function statusLine(rsvp: OwnRsvp) {
    return rsvp.status === 'GOING'
      ? t('rsvp.youreGoing', { count: rsvp.partySize })
      : t('rsvp.youreNotGoing');
  }

  async function handleCancel() {
    const result = await cancel();
    if (result.ok) {
      setCancelError(null);
      router.refresh();
    } else {
      setCancelError(result.code);
    }
  }

  if (ended) {
    return (
      <>
        <p>{t('event.ended')}</p>
        {ownRsvp && <p>{statusLine(ownRsvp)}</p>}
      </>
    );
  }

  if (!ownRsvp || editing) {
    return (
      <RsvpForm initial={ownRsvp ?? undefined} submit={submit} onDone={() => setEditing(false)} />
    );
  }

  return (
    <>
      <p>{statusLine(ownRsvp)}</p>
      {cancelError && <div role="alert">{t(`errors.${cancelError}`)}</div>}
      <button onClick={() => setEditing(true)}>{t('rsvp.change')}</button>
      {ownRsvp.status === 'GOING' && <button onClick={handleCancel}>{t('rsvp.cancel')}</button>}
    </>
  );
}

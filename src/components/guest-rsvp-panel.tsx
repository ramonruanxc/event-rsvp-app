'use client';

import { useState } from 'react';
import { Check, Clock, Pencil, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { ErrorCode } from '@/domain/errors';
import type { OwnRsvp } from '@/domain/types';
import type { ActionResult } from '@/lib/action-result';
import { Alert } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
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
 * no RSVP yet or while editing, and a read-only notice once the event has ended (REQ-31,
 * REQ-84).
 */
export function GuestRsvpPanel({ ownRsvp, ended, submit, cancel }: GuestRsvpPanelProps) {
  const t = useTranslations();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<ErrorCode | null>(null);

  function statusLine(rsvp: OwnRsvp) {
    return rsvp.status === 'GOING'
      ? t('rsvp.youreGoing', { count: rsvp.partySize })
      : t('rsvp.youreNotGoing');
  }

  async function handleCancel() {
    setCancelling(true);
    const result = await cancel();
    setCancelling(false);
    if (result.ok) {
      setCancelError(null);
      router.refresh();
    } else {
      setCancelError(result.code);
    }
  }

  if (ended) {
    return (
      <div className="notice">
        <Icon icon={Clock} size={20} />
        <div>
          <h2 className="h3">{t('event.ended')}</h2>
          <p className="small muted">{t('event.endedHint')}</p>
          {ownRsvp && (
            <p className="answer-line small">
              <Icon icon={ownRsvp.status === 'GOING' ? Check : X} />
              <span>{statusLine(ownRsvp)}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!ownRsvp || editing) {
    return (
      <RsvpForm initial={ownRsvp ?? undefined} submit={submit} onDone={() => setEditing(false)} />
    );
  }

  if (ownRsvp.status === 'GOING') {
    return (
      <div className="confirm">
        <div className="confirm-top" role="status">
          <span className="check-badge" aria-hidden="true">
            <Icon icon={Check} />
          </span>
          <div>
            <h2 className="h2">{statusLine(ownRsvp)}</h2>
            <p className="small">{t('rsvp.savedAs', { name: ownRsvp.name })}</p>
          </div>
        </div>
        {cancelError && <Alert>{t(`errors.${cancelError}`)}</Alert>}
        <div className="btn-row">
          <Button onClick={() => setEditing(true)}>
            <Icon icon={Pencil} />
            {t('rsvp.change')}
          </Button>
          <Button variant="ghost-danger" loading={cancelling} onClick={handleCancel}>
            {t('rsvp.cancel')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="notice">
      <Icon icon={X} size={20} />
      <div>
        <div role="status">
          <h2 className="h3">{statusLine(ownRsvp)}</h2>
          <p className="small muted">{t('rsvp.savedAs', { name: ownRsvp.name })}</p>
        </div>
        {cancelError && <Alert>{t(`errors.${cancelError}`)}</Alert>}
        <div className="btn-row mt-3">
          <Button onClick={() => setEditing(true)}>
            <Icon icon={Pencil} />
            {t('rsvp.change')}
          </Button>
        </div>
      </div>
    </div>
  );
}

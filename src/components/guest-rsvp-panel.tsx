'use client';

import { useEffect, useRef, useState } from 'react';
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

/** Where focus goes after the panel's content changes (REQ-140). */
type FocusTarget = 'status' | 'change' | 'name';

/**
 * A guest's view of their own RSVP: status line with Change / "I can't go", the form when there
 * is no RSVP yet or while editing, and a read-only notice once the event has ended (REQ-31,
 * REQ-84). The answer just saved is shown at once from the action's result, and focus moves to
 * the result: the status heading after Send or "I can't go", the name field after Change, the
 * Change button after "Keep my answer" (REQ-140, REQ-139).
 */
export function GuestRsvpPanel({ ownRsvp, ended, submit, cancel }: GuestRsvpPanelProps) {
  const t = useTranslations();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<OwnRsvp | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<ErrorCode | null>(null);
  const focusNext = useRef<FocusTarget | null>(null);
  const statusRef = useRef<HTMLHeadingElement>(null);
  const changeRef = useRef<HTMLButtonElement>(null);
  const rsvp = saved ?? ownRsvp;

  // Runs after every render: moves focus once the requested element exists (REQ-140).
  useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    const element =
      target === 'status'
        ? statusRef.current
        : target === 'change'
          ? changeRef.current
          : document.getElementById('rsvp-name');
    if (element) {
      element.focus();
      focusNext.current = null;
    }
  });

  function statusLine(r: OwnRsvp) {
    return r.status === 'GOING'
      ? t('rsvp.youreGoing', { count: r.partySize })
      : t('rsvp.youreNotGoing');
  }

  function startEditing() {
    focusNext.current = 'name';
    setEditing(true);
  }

  function keepAnswer() {
    focusNext.current = 'change';
    setEditing(false);
  }

  function handleSaved(result: OwnRsvp) {
    setSaved(result);
    setCancelError(null);
    focusNext.current = 'status';
    setEditing(false);
  }

  async function handleCancel() {
    setCancelling(true);
    const result = await cancel();
    setCancelling(false);
    if (result.ok) {
      setCancelError(null);
      setSaved(result.data);
      focusNext.current = 'status';
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
          {rsvp && (
            <p className="answer-line small">
              <Icon icon={rsvp.status === 'GOING' ? Check : X} />
              <span>{statusLine(rsvp)}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!rsvp || editing) {
    return (
      <RsvpForm
        initial={rsvp ?? undefined}
        submit={submit}
        onDone={handleSaved}
        onKeep={rsvp ? keepAnswer : undefined}
      />
    );
  }

  if (rsvp.status === 'GOING') {
    return (
      <div className="confirm">
        <div className="confirm-top" role="status">
          <span className="check-badge" aria-hidden="true">
            <Icon icon={Check} />
          </span>
          <div>
            <h2 className="h2" ref={statusRef} tabIndex={-1}>
              {statusLine(rsvp)}
            </h2>
            <p className="small">{t('rsvp.savedAs', { name: rsvp.name })}</p>
          </div>
        </div>
        {cancelError && <Alert>{t(`errors.${cancelError}`)}</Alert>}
        <div className="btn-row">
          <Button ref={changeRef} onClick={startEditing}>
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
          <h2 className="h3" ref={statusRef} tabIndex={-1}>
            {statusLine(rsvp)}
          </h2>
          <p className="small muted">{t('rsvp.savedAs', { name: rsvp.name })}</p>
        </div>
        {cancelError && <Alert>{t(`errors.${cancelError}`)}</Alert>}
        <div className="btn-row mt-3">
          <Button ref={changeRef} onClick={startEditing}>
            <Icon icon={Pencil} />
            {t('rsvp.change')}
          </Button>
        </div>
      </div>
    </div>
  );
}

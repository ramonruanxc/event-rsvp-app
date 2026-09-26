'use client';

import { CircleAlert, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from './button';
import { Icon } from './icon';

/** Props for {@link InlineConfirm}. */
export interface InlineConfirmProps {
  triggerLabel: string;
  triggerAriaLabel?: string;
  question: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => Promise<void>;
  layout?: 'block' | 'row';
  /** Message shown as an alert inside the group, e.g. why the action failed (REQ-142). */
  error?: string | null;
}

/** Destructive action confirmed inline, with no dialog and no window.confirm (REQ-72, REQ-67). */
export function InlineConfirm({
  triggerLabel,
  triggerAriaLabel,
  question,
  confirmLabel,
  cancelLabel,
  onConfirm,
  layout = 'block',
}: InlineConfirmProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const questionId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      keepRef.current?.focus();
      wasOpen.current = true;
    } else if (wasOpen.current) {
      triggerRef.current?.focus();
    }
  }, [open]);

  async function confirm() {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  const size = layout === 'row' ? 'sm' : 'md';

  if (!open) {
    return (
      <Button
        ref={triggerRef}
        variant="ghost-danger"
        size={size}
        aria-label={triggerAriaLabel}
        aria-expanded={false}
        onClick={() => setOpen(true)}
      >
        <Icon icon={Trash2} />
        {triggerLabel}
      </Button>
    );
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') setOpen(false);
  };

  const buttons = (
    <>
      <Button variant="danger" size={size} loading={pending} onClick={confirm}>
        <Icon icon={Trash2} />
        {confirmLabel}
      </Button>
      <Button
        ref={keepRef}
        variant="secondary"
        size={size}
        disabled={pending}
        onClick={() => setOpen(false)}
      >
        {cancelLabel}
      </Button>
    </>
  );

  if (layout === 'row') {
    return (
      <div
        role="group"
        aria-labelledby={questionId}
        className="inline-confirm-row"
        onKeyDown={onKeyDown}
      >
        <p id={questionId} className="sr-only">
          {question}
        </p>
        {buttons}
      </div>
    );
  }

  return (
    <div role="group" aria-labelledby={questionId} className="inline-confirm" onKeyDown={onKeyDown}>
      <p id={questionId} className="small">
        <Icon icon={CircleAlert} />
        <span>{question}</span>
      </p>
      <div className="btn-row">{buttons}</div>
    </div>
  );
}

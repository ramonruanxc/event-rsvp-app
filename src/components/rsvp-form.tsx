'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ValidationError, type ErrorCode, type FieldErrors } from '@/domain/errors';
import { rsvpInputSchema } from '@/domain/schemas';
import type { RsvpStatus, OwnRsvp } from '@/domain/types';
import type { ActionResult } from '@/lib/action-result';

/** Values collected by {@link RsvpForm}. */
export interface RsvpFormValues {
  name: string;
  status: RsvpStatus;
  partySize: number;
}

/** Props of {@link RsvpForm}. */
export interface RsvpFormProps {
  initial?: RsvpFormValues;
  submit: (values: RsvpFormValues, honeypot: string) => Promise<ActionResult<OwnRsvp>>;
  onDone?: () => void;
}

/** Guest RSVP form: name, Going/Not going, party size when Going (REQ-31, REQ-26, REQ-57). */
export function RsvpForm({ initial, submit, onDone }: RsvpFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [status, setStatus] = useState<RsvpStatus>(initial?.status ?? 'GOING');
  const [partySize, setPartySize] = useState(initial?.partySize ?? 1);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<ErrorCode | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function errorFor(field: 'name' | 'status' | 'partySize'): string | null {
    const key = fieldErrors[field];
    return key ? t(`validation.${key}`) : null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: RsvpFormValues = { name, status, partySize };
    const parsed = rsvpInputSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(ValidationError.fromZod(parsed.error).fieldErrors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    // TASK-143 adds the honeypot field; for now it is always empty.
    const result = await submit(parsed.data, '');
    setSubmitting(false);

    if (result.ok) {
      router.refresh();
      onDone?.();
      return;
    }
    if (result.code === 'VALIDATION_ERROR') {
      setFieldErrors(result.fieldErrors ?? {});
    } else {
      setFormError(result.code);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>{t('rsvp.title')}</h2>
      {formError && <div role="alert">{t(`errors.${formError}`)}</div>}

      <div>
        <label htmlFor="rsvp-name">{t('rsvp.name')}</label>
        <input
          id="rsvp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={fieldErrors.name ? 'true' : undefined}
          aria-describedby={fieldErrors.name ? 'rsvp-name-error' : undefined}
        />
        {errorFor('name') && <p id="rsvp-name-error">{errorFor('name')}</p>}
      </div>

      <div role="radiogroup">
        <label>
          <input
            type="radio"
            name="rsvp-status"
            value="GOING"
            checked={status === 'GOING'}
            onChange={() => setStatus('GOING')}
          />
          {t('rsvp.going')}
        </label>
        <label>
          <input
            type="radio"
            name="rsvp-status"
            value="NOT_GOING"
            checked={status === 'NOT_GOING'}
            onChange={() => setStatus('NOT_GOING')}
          />
          {t('rsvp.notGoing')}
        </label>
      </div>

      {status === 'GOING' && (
        <div>
          <label htmlFor="rsvp-party-size">{t('rsvp.partySize')}</label>
          <input
            id="rsvp-party-size"
            type="number"
            min={1}
            max={10}
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            aria-invalid={fieldErrors.partySize ? 'true' : undefined}
            aria-describedby={fieldErrors.partySize ? 'rsvp-party-size-error' : undefined}
          />
          {errorFor('partySize') && <p id="rsvp-party-size-error">{errorFor('partySize')}</p>}
        </div>
      )}

      <button type="submit" disabled={submitting}>
        {t('rsvp.submit')}
      </button>
    </form>
  );
}

'use client';

import { useRef, useState, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ValidationError, type ErrorCode, type FieldErrors } from '@/domain/errors';
import { rsvpInputSchema } from '@/domain/schemas';
import type { RsvpStatus, OwnRsvp } from '@/domain/types';
import type { ActionResult } from '@/lib/action-result';
import { focusFirstInvalid } from '@/lib/focus';
import {
  Alert,
  describedBy,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
} from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Stepper } from '@/components/ui/stepper';

/** Maps RsvpForm field names to their control ids (REQ-137). */
const RSVP_FIELD_IDS = { name: 'rsvp-name', partySize: 'rsvp-party-size' } as const;

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
  onDone?: (rsvp: OwnRsvp) => void;
  /** When given (editing an existing RSVP), shows "Keep my answer", which calls it (REQ-139). */
  onKeep?: () => void;
}

/** Guest RSVP form: name, Going/Not going, party size when Going (REQ-31, REQ-26, REQ-57). */
export function RsvpForm({ initial, submit, onDone, onKeep }: RsvpFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [status, setStatus] = useState<RsvpStatus>(initial?.status ?? 'GOING');
  // A stored Not going answer has 0; Going starts at one person (REQ-138, BR-173).
  const [partySize, setPartySize] = useState(Math.max(1, initial?.partySize ?? 1));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<ErrorCode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  function errorFor(field: 'name' | 'status' | 'partySize'): string | null {
    const key = fieldErrors[field];
    return key ? t(`validation.${key}`) : null;
  }

  /** Shows field errors, then focuses the first invalid field (REQ-137). */
  function showFieldErrors(errors: FieldErrors) {
    flushSync(() => {
      setFieldErrors(errors);
      setFormError(null);
    });
    focusFirstInvalid(formRef.current, errors, RSVP_FIELD_IDS);
  }

  /**
   * Text for the top-level alert. Covers action-level failures (e.g. `DUPLICATE_NAME`,
   * `RATE_LIMITED`) as well as server-side form validation failures that carry no specific
   * field (e.g. a filled honeypot, REQ-58). Form-level failures show rsvp.formRejected, which
   * never reveals the honeypot.
   */
  function formAlert(): string | null {
    if (formError) return t(`errors.${formError}`);
    if (fieldErrors.form) return t('rsvp.formRejected');
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: RsvpFormValues = { name, status, partySize };
    const parsed = rsvpInputSchema.safeParse(values);
    if (!parsed.success) {
      showFieldErrors(ValidationError.fromZod(parsed.error).fieldErrors);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    const result = await submit(parsed.data, honeypot);
    setSubmitting(false);

    if (result.ok) {
      router.refresh();
      onDone?.(result.data);
      return;
    }
    if (result.code === 'VALIDATION_ERROR') {
      showFieldErrors(result.fieldErrors ?? {});
    } else {
      setFormError(result.code);
    }
  }

  return (
    <form
      ref={formRef}
      className="rsvp-form"
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="rsvp-title"
    >
      <h2 className="h2" id="rsvp-title">
        {t('rsvp.title')}
      </h2>
      {formAlert() && <Alert>{formAlert()}</Alert>}

      <Field>
        <FieldLabel htmlFor="rsvp-name">{t('rsvp.name')}</FieldLabel>
        <input
          className="input"
          id="rsvp-name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={fieldErrors.name ? 'true' : undefined}
          aria-describedby={describedBy('rsvp-name-hint', fieldErrors.name && 'rsvp-name-error')}
        />
        <FieldHint id="rsvp-name-hint">{t('rsvp.nameHint')}</FieldHint>
        {errorFor('name') && <FieldError id="rsvp-name-error">{errorFor('name')}</FieldError>}
      </Field>

      <SegmentedControl
        name="rsvp-status"
        label={t('rsvp.answer')}
        labelId="rsvp-answer-label"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'GOING', label: t('rsvp.going'), icon: Check, tone: 'success' },
          { value: 'NOT_GOING', label: t('rsvp.notGoing'), icon: X, tone: 'muted' },
        ]}
      />

      {status === 'GOING' && (
        <Field>
          <FieldLabel htmlFor="rsvp-party-size">{t('rsvp.partySize')}</FieldLabel>
          <Stepper
            id="rsvp-party-size"
            value={partySize}
            min={1}
            max={10}
            onChange={setPartySize}
            decreaseLabel={t('rsvp.decrease')}
            increaseLabel={t('rsvp.increase')}
            describedBy={describedBy(
              'rsvp-party-size-hint',
              fieldErrors.partySize && 'rsvp-party-size-error',
            )}
            invalid={Boolean(fieldErrors.partySize)}
          />
          <FieldHint id="rsvp-party-size-hint">{t('rsvp.partySizeHint')}</FieldHint>
          {errorFor('partySize') && (
            <FieldError id="rsvp-party-size-error">{errorFor('partySize')}</FieldError>
          )}
        </Field>
      )}

      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <Button type="submit" variant="primary" size="lg" loading={submitting}>
        {t('rsvp.submit')}
      </Button>
      {onKeep && (
        <Button variant="secondary" size="lg" onClick={onKeep}>
          {t('rsvp.keep')}
        </Button>
      )}
    </form>
  );
}

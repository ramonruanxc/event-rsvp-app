'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ValidationError, type ErrorCode, type FieldErrors } from '@/domain/errors';
import { eventInputSchema, type EventFormValues } from '@/domain/schemas';
import type { ActionResult } from '@/lib/action-result';
import { detectBrowserTimeZone } from '@/lib/browser-timezone';
import type { AiField, ParseEventResult } from '@/lib/ai/types';

type FieldName = 'name' | 'description' | 'date' | 'time' | 'timezone' | 'location';

/** Props of {@link EventForm}: optional prefilled values, the submit handler and the AI fill action. */
export interface EventFormProps {
  initialValues?: Partial<Record<FieldName, string>>;
  submit: (values: EventFormValues) => Promise<ActionResult<{ slug: string }>>;
  /** When present, renders the "Fill with AI" panel (REQ-51). */
  aiFill?: (text: string, timezone: string | null) => Promise<ActionResult<ParseEventResult>>;
}

/**
 * Create/edit event form (REQ-15): validates client-side with `eventInputSchema` before
 * delegating persistence to `submit`, and renders any error the server returns. When `aiFill`
 * is given, also renders the "Fill with AI" panel (REQ-51).
 */
export function EventForm({ initialValues, submit, aiFill }: EventFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [date, setDate] = useState(initialValues?.date ?? '');
  const [time, setTime] = useState(initialValues?.time ?? '');
  const [timezone, setTimezone] = useState(initialValues?.timezone ?? '');
  const [location, setLocation] = useState(initialValues?.location ?? '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<ErrorCode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiText, setAiText] = useState('');
  const [filling, setFilling] = useState(false);
  const [missing, setMissing] = useState<AiField[]>([]);
  const [aiNotice, setAiNotice] = useState<ErrorCode | null>(null);

  // Only the browser knows its own timezone; deferred to an effect so the server-rendered
  // markup (which cannot know it) matches the first client render (REQ-13).
  useEffect(() => {
    if (!timezone) setTimezone(detectBrowserTimeZone());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const timeZoneOptions = useMemo(() => {
    const supported = Intl.supportedValuesOf('timeZone');
    return timezone && !supported.includes(timezone) ? [timezone, ...supported] : supported;
  }, [timezone]);

  function errorFor(field: FieldName): string | null {
    const key = fieldErrors[field];
    return key ? t(`validation.${key}`) : null;
  }

  async function handleAiFill() {
    if (!aiFill) return;
    setFilling(true);
    setAiNotice(null);
    const result = await aiFill(aiText, timezone || null);
    setFilling(false);

    if (!result.ok) {
      setAiNotice(result.code);
      return;
    }

    const { fields } = result.data;
    if (fields.name !== null) setName(fields.name);
    if (fields.description !== null) setDescription(fields.description);
    if (fields.date !== null) setDate(fields.date);
    if (fields.time !== null) setTime(fields.time);
    if (fields.location !== null) setLocation(fields.location);
    if (fields.timezone !== null) setTimezone(fields.timezone);
    setMissing(result.data.missing);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: EventFormValues = { name, description, date, time, timezone, location };
    const parsed = eventInputSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(ValidationError.fromZod(parsed.error).fieldErrors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);
    const result = await submit(values);
    setSubmitting(false);

    if (result.ok) {
      router.push(`/e/${result.data.slug}`);
      return;
    }
    if (result.code === 'VALIDATION_ERROR') {
      setFieldErrors(result.fieldErrors ?? {});
    } else {
      setFormError(result.code);
    }
  }

  function ariaInvalid(field: AiField): 'true' | undefined {
    return fieldErrors[field] || missing.includes(field) ? 'true' : undefined;
  }

  function ariaDescribedBy(field: AiField): string | undefined {
    if (fieldErrors[field]) return `${field}-error`;
    if (missing.includes(field)) return `${field}-missing`;
    return undefined;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {aiFill && (
        <div>
          <label htmlFor="ai-text">{t('ai.label')}</label>
          <textarea
            id="ai-text"
            value={aiText}
            placeholder={t('ai.placeholder')}
            onChange={(e) => setAiText(e.target.value)}
          />
          <button type="button" onClick={handleAiFill} disabled={filling}>
            {filling ? t('ai.filling') : t('ai.fill')}
          </button>
          {aiNotice && <div role="alert">{t(`errors.${aiNotice}`)}</div>}
        </div>
      )}

      {formError && <div role="alert">{t(`errors.${formError}`)}</div>}

      <div>
        <label htmlFor="name">{t('eventForm.name')}</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={ariaInvalid('name')}
          aria-describedby={ariaDescribedBy('name')}
        />
        {errorFor('name') && <p id="name-error">{errorFor('name')}</p>}
        {missing.includes('name') && <p id="name-missing">{t('ai.missingHint')}</p>}
      </div>

      <div>
        <label htmlFor="description">{t('eventForm.description')}</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={ariaInvalid('description')}
          aria-describedby={ariaDescribedBy('description')}
        />
        {errorFor('description') && <p id="description-error">{errorFor('description')}</p>}
        {missing.includes('description') && <p id="description-missing">{t('ai.missingHint')}</p>}
      </div>

      <div>
        <label htmlFor="date">{t('eventForm.date')}</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-invalid={ariaInvalid('date')}
          aria-describedby={ariaDescribedBy('date')}
        />
        {errorFor('date') && <p id="date-error">{errorFor('date')}</p>}
        {missing.includes('date') && <p id="date-missing">{t('ai.missingHint')}</p>}
      </div>

      <div>
        <label htmlFor="time">{t('eventForm.time')}</label>
        <input
          id="time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-invalid={ariaInvalid('time')}
          aria-describedby={ariaDescribedBy('time')}
        />
        {errorFor('time') && <p id="time-error">{errorFor('time')}</p>}
        {missing.includes('time') && <p id="time-missing">{t('ai.missingHint')}</p>}
      </div>

      <div>
        <label htmlFor="timezone">{t('eventForm.timezone')}</label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          aria-invalid={ariaInvalid('timezone')}
          aria-describedby={ariaDescribedBy('timezone')}
        >
          {timeZoneOptions.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        {errorFor('timezone') && <p id="timezone-error">{errorFor('timezone')}</p>}
        {missing.includes('timezone') && <p id="timezone-missing">{t('ai.missingHint')}</p>}
      </div>

      <div>
        <label htmlFor="location">{t('eventForm.location')}</label>
        <input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-invalid={ariaInvalid('location')}
          aria-describedby={ariaDescribedBy('location')}
        />
        {errorFor('location') && <p id="location-error">{errorFor('location')}</p>}
        {missing.includes('location') && <p id="location-missing">{t('ai.missingHint')}</p>}
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? t('eventForm.saving') : t('eventForm.save')}
      </button>
    </form>
  );
}

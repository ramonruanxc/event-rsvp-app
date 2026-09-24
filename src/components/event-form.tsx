'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ValidationError, type ErrorCode, type FieldErrors } from '@/domain/errors';
import { eventInputSchema, type EventFormValues } from '@/domain/schemas';
import type { ActionResult } from '@/lib/action-result';
import { detectBrowserTimeZone } from '@/lib/browser-timezone';

type FieldName = 'name' | 'description' | 'date' | 'time' | 'timezone' | 'location';

/** Props of {@link EventForm}: optional prefilled values and the submit handler (server action). */
export interface EventFormProps {
  initialValues?: Partial<Record<FieldName, string>>;
  submit: (values: EventFormValues) => Promise<ActionResult<{ slug: string }>>;
}

/**
 * Create/edit event form (REQ-15): validates client-side with `eventInputSchema` before
 * delegating persistence to `submit`, and renders any error the server returns.
 */
export function EventForm({ initialValues, submit }: EventFormProps) {
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

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && <div role="alert">{t(`errors.${formError}`)}</div>}

      <div>
        <label htmlFor="name">{t('eventForm.name')}</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={fieldErrors.name ? 'true' : undefined}
          aria-describedby={fieldErrors.name ? 'name-error' : undefined}
        />
        {errorFor('name') && <p id="name-error">{errorFor('name')}</p>}
      </div>

      <div>
        <label htmlFor="description">{t('eventForm.description')}</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={fieldErrors.description ? 'true' : undefined}
          aria-describedby={fieldErrors.description ? 'description-error' : undefined}
        />
        {errorFor('description') && <p id="description-error">{errorFor('description')}</p>}
      </div>

      <div>
        <label htmlFor="date">{t('eventForm.date')}</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-invalid={fieldErrors.date ? 'true' : undefined}
          aria-describedby={fieldErrors.date ? 'date-error' : undefined}
        />
        {errorFor('date') && <p id="date-error">{errorFor('date')}</p>}
      </div>

      <div>
        <label htmlFor="time">{t('eventForm.time')}</label>
        <input
          id="time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-invalid={fieldErrors.time ? 'true' : undefined}
          aria-describedby={fieldErrors.time ? 'time-error' : undefined}
        />
        {errorFor('time') && <p id="time-error">{errorFor('time')}</p>}
      </div>

      <div>
        <label htmlFor="timezone">{t('eventForm.timezone')}</label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          aria-invalid={fieldErrors.timezone ? 'true' : undefined}
          aria-describedby={fieldErrors.timezone ? 'timezone-error' : undefined}
        >
          {timeZoneOptions.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        {errorFor('timezone') && <p id="timezone-error">{errorFor('timezone')}</p>}
      </div>

      <div>
        <label htmlFor="location">{t('eventForm.location')}</label>
        <input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-invalid={fieldErrors.location ? 'true' : undefined}
          aria-describedby={fieldErrors.location ? 'location-error' : undefined}
        />
        {errorFor('location') && <p id="location-error">{errorFor('location')}</p>}
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? t('eventForm.saving') : t('eventForm.save')}
      </button>
    </form>
  );
}

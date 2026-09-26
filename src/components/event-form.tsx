'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { CalendarDays, Check, ChevronDown, Clock, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { ValidationError, type ErrorCode, type FieldErrors } from '@/domain/errors';
import { eventInputSchema, type EventFormValues } from '@/domain/schemas';
import type { ActionResult } from '@/lib/action-result';
import { detectBrowserTimeZone } from '@/lib/browser-timezone';
import { focusFirstInvalid } from '@/lib/focus';
import type { AiField, ParseEventResult } from '@/lib/ai/types';
import {
  Alert,
  describedBy,
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
  NeededBadge,
} from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

type FieldName = 'name' | 'description' | 'date' | 'time' | 'timezone' | 'location';

/** Maps EventForm field names to their control ids (REQ-137). */
const EVENT_FIELD_IDS: Record<FieldName, string> = {
  name: 'name',
  description: 'description',
  date: 'date',
  time: 'time',
  timezone: 'timezone',
  location: 'location',
};

/** Props of {@link EventForm}: optional prefilled values, the submit handler and the AI fill action. */
export interface EventFormProps {
  initialValues?: Partial<Record<FieldName, string>>;
  submit: (values: EventFormValues) => Promise<ActionResult<{ slug: string }>>;
  /** When present, renders the "Fill with AI" panel (REQ-51). */
  aiFill?: (text: string, timezone: string | null) => Promise<ActionResult<ParseEventResult>>;
  /** When true and `aiFill` is absent, the AI panel's place says AI fill is not set up on this server (REQ-156). */
  aiNotConfigured?: boolean;
}

/**
 * Opens the native picker of a date or time input (REQ-131). `showPicker` is missing in older
 * browsers and throws without user activation or when the picker is already open; both cases are
 * ignored, so the field still accepts typing.
 */
function openPicker(input: HTMLInputElement | null): void {
  if (!input || typeof input.showPicker !== 'function') return;
  try {
    input.showPicker();
  } catch {
    // Unsupported here, refused, or already open: typing still works.
  }
}

/** Focuses a date or time input, then opens its picker (the icon buttons, REQ-131). */
function focusAndOpenPicker(input: HTMLInputElement | null): void {
  if (!input) return;
  input.focus();
  openPicker(input);
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
  const [aiNotice, setAiNotice] = useState<ErrorCode | 'notAnEvent' | null>(null);
  const [filledCount, setFilledCount] = useState<number | null>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

  /** Shows field errors, then focuses the first invalid field (REQ-137). */
  function showFieldErrors(errors: FieldErrors) {
    flushSync(() => {
      setFieldErrors(errors);
      setFormError(null);
    });
    focusFirstInvalid(formRef.current, errors, EVENT_FIELD_IDS);
  }

  async function handleAiFill() {
    if (!aiFill) return;
    setFilling(true);
    setAiNotice(null);
    setFilledCount(null);
    const result = await aiFill(aiText, timezone || null);
    setFilling(false);

    if (!result.ok) {
      setAiNotice(result.code);
      return;
    }

    if (result.data.notAnEvent) {
      setAiNotice('notAnEvent');
      setMissing([]);
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
    setFilledCount(Object.values(fields).filter((v) => v !== null).length);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: EventFormValues = { name, description, date, time, timezone, location };
    const parsed = eventInputSchema.safeParse(values);
    if (!parsed.success) {
      showFieldErrors(ValidationError.fromZod(parsed.error).fieldErrors);
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
      showFieldErrors(result.fieldErrors ?? {});
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

  /** "Needed" badge for a field the AI left empty, or nothing (REQ-70, REQ-83). */
  const needed = (field: AiField) =>
    missing.includes(field) ? <NeededBadge>{t('ai.needed')}</NeededBadge> : undefined;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {aiFill && (
        <div className="ai-panel">
          <label className="label" htmlFor="ai-text">
            <Icon icon={Sparkles} className="text-link" />
            {t('ai.label')}
          </label>
          <textarea
            className="textarea"
            id="ai-text"
            rows={3}
            value={aiText}
            placeholder={t('ai.placeholder')}
            onChange={(e) => setAiText(e.target.value)}
          />
          <div className="ai-foot">
            <Button onClick={handleAiFill} loading={filling}>
              <Icon icon={Sparkles} />
              {t('ai.fill')}
            </Button>
            <p className="small ai-status" role="status">
              {filling ? (
                <span>{t('ai.filling')}</span>
              ) : filledCount !== null ? (
                <span className="ok">
                  <Icon icon={Check} />
                  {t('ai.filled', { count: filledCount })}
                </span>
              ) : null}
            </p>
          </div>
          {aiNotice && (
            <Alert>
              {aiNotice === 'notAnEvent' ? t('ai.notAnEvent') : t(`errors.${aiNotice}`)}
            </Alert>
          )}
        </div>
      )}

      {formError && <Alert>{t(`errors.${formError}`)}</Alert>}

      <fieldset className="form-group">
        <legend className="h3">{t('eventForm.groupWhat')}</legend>
        <Field missing={missing.includes('name')}>
          <FieldLabel htmlFor="name" badge={needed('name')}>
            {t('eventForm.name')}
          </FieldLabel>
          <input
            className="input"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={ariaInvalid('name')}
            aria-describedby={ariaDescribedBy('name')}
          />
          {errorFor('name') && <FieldError id="name-error">{errorFor('name')}</FieldError>}
          {missing.includes('name') && (
            <FieldHint id="name-missing">{t('ai.missingHint')}</FieldHint>
          )}
        </Field>
        <Field missing={missing.includes('description')}>
          <FieldLabel htmlFor="description" badge={needed('description')}>
            {t('eventForm.description')}
          </FieldLabel>
          <textarea
            className="textarea"
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={ariaInvalid('description')}
            aria-describedby={ariaDescribedBy('description')}
          />
          {errorFor('description') && (
            <FieldError id="description-error">{errorFor('description')}</FieldError>
          )}
          {missing.includes('description') && (
            <FieldHint id="description-missing">{t('ai.missingHint')}</FieldHint>
          )}
        </Field>
      </fieldset>

      <fieldset className="form-group">
        <legend className="h3">{t('eventForm.groupWhen')}</legend>
        <div className="pair">
          <Field missing={missing.includes('date')}>
            <FieldLabel htmlFor="date" badge={needed('date')}>
              {t('eventForm.date')}
            </FieldLabel>
            <div className="picker-wrap">
              <input
                ref={dateRef}
                className="input"
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onClick={(e) => openPicker(e.currentTarget)}
                aria-invalid={ariaInvalid('date')}
                aria-describedby={ariaDescribedBy('date')}
              />
              <button
                type="button"
                className="icon-btn picker-btn"
                aria-label={t('eventForm.openDatePicker')}
                onClick={() => focusAndOpenPicker(dateRef.current)}
              >
                <Icon icon={CalendarDays} />
              </button>
            </div>
            {errorFor('date') && <FieldError id="date-error">{errorFor('date')}</FieldError>}
            {missing.includes('date') && (
              <FieldHint id="date-missing">{t('ai.missingHint')}</FieldHint>
            )}
          </Field>
          <Field missing={missing.includes('time')}>
            <FieldLabel htmlFor="time" badge={needed('time')}>
              {t('eventForm.time')}
            </FieldLabel>
            <div className="picker-wrap">
              <input
                ref={timeRef}
                className="input"
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                onClick={(e) => openPicker(e.currentTarget)}
                aria-invalid={ariaInvalid('time')}
                aria-describedby={ariaDescribedBy('time')}
              />
              <button
                type="button"
                className="icon-btn picker-btn"
                aria-label={t('eventForm.openTimePicker')}
                onClick={() => focusAndOpenPicker(timeRef.current)}
              >
                <Icon icon={Clock} />
              </button>
            </div>
            {errorFor('time') && <FieldError id="time-error">{errorFor('time')}</FieldError>}
            {missing.includes('time') && (
              <FieldHint id="time-missing">{t('ai.missingHint')}</FieldHint>
            )}
          </Field>
        </div>
        <Field className="mt-4" missing={missing.includes('timezone')}>
          <FieldLabel htmlFor="timezone" badge={needed('timezone')}>
            {t('eventForm.timezone')}
          </FieldLabel>
          <div className="select-wrap">
            <select
              className="select"
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              aria-invalid={ariaInvalid('timezone')}
              aria-describedby={describedBy(ariaDescribedBy('timezone'), 'timezone-hint')}
            >
              {timeZoneOptions.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            <Icon icon={ChevronDown} />
          </div>
          <FieldHint id="timezone-hint">{t('eventForm.timezoneHint')}</FieldHint>
          {errorFor('timezone') && (
            <FieldError id="timezone-error">{errorFor('timezone')}</FieldError>
          )}
          {missing.includes('timezone') && (
            <FieldHint id="timezone-missing">{t('ai.missingHint')}</FieldHint>
          )}
        </Field>
      </fieldset>

      <fieldset className="form-group">
        <legend className="h3">{t('eventForm.groupWhere')}</legend>
        <Field missing={missing.includes('location')}>
          <FieldLabel htmlFor="location" badge={needed('location')}>
            {t('eventForm.location')}
          </FieldLabel>
          <input
            className="input"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            aria-invalid={ariaInvalid('location')}
            aria-describedby={ariaDescribedBy('location')}
          />
          {errorFor('location') && (
            <FieldError id="location-error">{errorFor('location')}</FieldError>
          )}
          {missing.includes('location') && (
            <FieldHint id="location-missing">{t('ai.missingHint')}</FieldHint>
          )}
        </Field>
      </fieldset>

      <div className="form-foot">
        <Button type="submit" variant="primary" loading={submitting}>
          {t('eventForm.save')}
        </Button>
      </div>
    </form>
  );
}

import { z } from 'zod';
import { AiUnavailableError } from '@/domain/errors';
import { eventDescriptionSchema, eventNameSchema, isCalendarDate } from '@/domain/schemas';
import { isValidTimeZone } from '@/domain/timezone';
import { AI_FIELDS } from './types';
import type { AiField, ParseEventResult } from './types';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function normalizeName(value: string | null): string | null {
  if (value === null) return null;
  const result = eventNameSchema.safeParse(value);
  return result.success ? result.data : null;
}

function normalizeDescription(value: string | null): string | null {
  if (value === null) return null;
  const result = eventDescriptionSchema.safeParse(value);
  return result.success ? result.data : null;
}

function normalizeDate(value: string | null): string | null {
  if (value === null) return null;
  return isCalendarDate(value) ? value : null;
}

function normalizeTime(value: string | null): string | null {
  if (value === null) return null;
  return TIME_RE.test(value) ? value : null;
}

function normalizeLocation(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Schema of the model's raw structured output, passed to the Anthropic API as the output format (BR-70). */
export const aiRawOutputSchema = z.object({
  isEvent: z.boolean(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  date: z.string().nullable(),
  time: z.string().nullable(),
  timezone: z.string().nullable(),
  location: z.string().nullable(),
});
/** Validated shape of the model's raw structured output. */
export type AiRawOutput = z.infer<typeof aiRawOutputSchema>;

/** Resolves the timezone priority (REQ-46, BR-60, BR-61): valid text timezone, else valid form timezone, else null. */
function resolveTimezone(
  modelTimezone: string | null,
  formTimezone: string | null,
): { timezone: string | null; fromText: boolean } {
  if (modelTimezone !== null && isValidTimeZone(modelTimezone)) {
    return { timezone: modelTimezone, fromText: true };
  }
  if (formTimezone && isValidTimeZone(formTimezone)) {
    return { timezone: formTimezone, fromText: false };
  }
  return { timezone: null, fromText: false };
}

/** Validates the model's raw output field by field, throwing AiUnavailableError when the shape itself is wrong (BR-59). */
export function normalizeAiOutput(raw: unknown, formTimezone: string | null): ParseEventResult {
  const parsed = aiRawOutputSchema.safeParse(raw);
  if (!parsed.success) throw new AiUnavailableError();
  const data = parsed.data;

  const { timezone, fromText } = resolveTimezone(data.timezone, formTimezone);

  const fields: Record<AiField, string | null> = {
    name: normalizeName(data.name),
    description: normalizeDescription(data.description),
    date: normalizeDate(data.date),
    time: normalizeTime(data.time),
    timezone,
    location: normalizeLocation(data.location),
  };

  const missing = AI_FIELDS.filter((field) => fields[field] === null);

  return { fields, missing, timezoneFromText: fromText, notAnEvent: false };
}

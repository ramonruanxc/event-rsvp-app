import { z } from 'zod';
import { AiUnavailableError } from '@/domain/errors';
import { eventDescriptionSchema, eventNameSchema, isCalendarDate } from '@/domain/schemas';
import { isValidTimeZone } from '@/domain/timezone';
import type { AiField } from './types';
import type { ParseEventResult } from './types';

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

/** Validates the model's raw output field by field, throwing AiUnavailableError when the shape itself is wrong (BR-59). */
export function normalizeAiOutput(
  raw: unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used starting TASK-113 (timezone priority)
  formTimezone: string | null,
): ParseEventResult {
  const parsed = aiRawOutputSchema.safeParse(raw);
  if (!parsed.success) throw new AiUnavailableError();
  const data = parsed.data;

  const timezone = data.timezone !== null && isValidTimeZone(data.timezone) ? data.timezone : null;

  const fields: Record<AiField, string | null> = {
    name: normalizeName(data.name),
    description: normalizeDescription(data.description),
    date: normalizeDate(data.date),
    time: normalizeTime(data.time),
    timezone,
    location: normalizeLocation(data.location),
  };

  return { fields, missing: [], timezoneFromText: timezone !== null, notAnEvent: false };
}

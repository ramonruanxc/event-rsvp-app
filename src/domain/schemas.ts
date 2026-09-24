import { z } from 'zod';
import { isValidTimeZone } from './timezone';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const requiredText = (max: number) =>
  z.string({ error: 'required' }).trim().min(1, 'required').max(max, 'tooLong');

export const eventNameSchema = requiredText(120);
export const eventDescriptionSchema = requiredText(2000);
export const eventLocationSchema = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? v : null));

/** True for an existing calendar date written yyyy-MM-dd. */
export function isCalendarDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export const eventDateSchema = z
  .string({ error: 'required' })
  .trim()
  .min(1, 'required')
  .refine(isCalendarDate, 'invalidFormat');
export const eventTimeSchema = z
  .string({ error: 'required' })
  .trim()
  .min(1, 'required')
  .regex(TIME_RE, 'invalidFormat');

export const timezoneSchema = z
  .string({ error: 'required' })
  .trim()
  .min(1, 'required')
  .refine(isValidTimeZone, 'invalidTimezone');

/** Raw shape and validated output of the event create/edit form (BR-04..BR-06, BR-13, BR-21). */
export const eventInputSchema = z.object({
  name: eventNameSchema,
  description: eventDescriptionSchema,
  date: eventDateSchema,
  time: eventTimeSchema,
  timezone: timezoneSchema,
  location: eventLocationSchema,
});
/** Unvalidated input shape of the event form. */
export type EventFormValues = z.input<typeof eventInputSchema>;
/** Validated, transformed output of eventInputSchema. */
export type EventInput = z.output<typeof eventInputSchema>;

/** Raw shape and validated output of the RSVP form (BR-22..BR-27). */
export const rsvpInputSchema = z
  .object({
    name: requiredText(80),
    status: z.enum(['GOING', 'NOT_GOING'], { error: 'invalidStatus' }),
    partySize: z.unknown().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.status !== 'GOING') return;
    const n = v.partySize;
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 10) {
      ctx.addIssue({ code: 'custom', path: ['partySize'], message: 'partySizeRange' });
    }
  })
  .transform((v) => ({
    name: v.name,
    status: v.status,
    partySize: v.status === 'GOING' ? (v.partySize as number) : 0,
  }));
/** Validated, transformed output of rsvpInputSchema. */
export type RsvpInput = z.output<typeof rsvpInputSchema>;

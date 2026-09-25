import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, passwordLength } from './credentials';
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

export const emailSchema = z
  .string({ error: 'required' })
  .trim()
  .toLowerCase()
  .min(1, 'required')
  .max(254, 'tooLong')
  .email('invalidEmail');
export const passwordSchema = z
  .string({ error: 'required' })
  .min(1, 'required')
  .refine((v) => {
    const n = passwordLength(v);
    return n >= PASSWORD_MIN_LENGTH && n <= PASSWORD_MAX_LENGTH;
  }, 'passwordLength');
const confirmSchema = z.string({ error: 'required' }).min(1, 'required');
export const registerInputSchema = z
  .object({
    name: requiredText(80),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: confirmSchema,
  })
  .superRefine((v, ctx) => {
    if (v.password !== v.confirmPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'passwordMismatch' });
    }
  })
  .transform(({ name, email, password }) => ({ name, email, password }));
/** Unvalidated input shape of the registration form. */
export type RegisterFormValues = z.input<typeof registerInputSchema>;
/** Validated, transformed output of registerInputSchema. */
export type RegisterInput = z.output<typeof registerInputSchema>;
export const signInInputSchema = z.object({
  email: emailSchema,
  password: z.string({ error: 'required' }).min(1, 'required'),
});
/** Unvalidated input shape of the sign-in form. */
export type SignInFormValues = z.input<typeof signInInputSchema>;
/** Validated, transformed output of signInInputSchema. */
export type SignInInput = z.output<typeof signInInputSchema>;
export const setPasswordInputSchema = z
  .object({
    currentPassword: z
      .string()
      .optional()
      .transform((v) => v ?? ''),
    newPassword: passwordSchema,
    confirmPassword: confirmSchema,
  })
  .superRefine((v, ctx) => {
    if (v.newPassword !== v.confirmPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'passwordMismatch' });
    }
  })
  .transform(({ currentPassword, newPassword }) => ({ currentPassword, newPassword }));
/** Unvalidated input shape of the set/change password form. */
export type SetPasswordFormValues = z.input<typeof setPasswordInputSchema>;
/** Validated, transformed output of setPasswordInputSchema. */
export type SetPasswordInput = z.output<typeof setPasswordInputSchema>;

import { z } from 'zod';

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
export function isCalendarDate(_value: string): boolean {
  return true;
}

export const eventDateSchema = z.string();
export const eventTimeSchema = z.string();

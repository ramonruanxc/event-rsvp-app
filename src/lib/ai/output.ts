import { z } from 'zod';
import { AiUnavailableError } from '@/domain/errors';
import type { ParseEventResult } from './types';

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
export function normalizeAiOutput(_raw: unknown, _formTimezone: string | null): ParseEventResult {
  throw new Error('not implemented');
}

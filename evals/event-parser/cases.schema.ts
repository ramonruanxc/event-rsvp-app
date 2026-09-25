import { z } from 'zod';
import { AI_FIELDS } from '@/lib/ai/types';
import { CATEGORIES, HARD_TAGS } from './types';

/** True when `source` compiles as a case-insensitive regular expression (REQ-102). */
function isValidPattern(source: string): boolean {
  try {
    new RegExp(source, 'i');
    return true;
  } catch {
    return false;
  }
}

/** A matcher as it appears in the eval cases JSON file (REQ-92). */
const matcherSchema = z.union([
  z.string(),
  z.null(),
  z.object({
    includes: z.string().optional(),
    excludes: z.string().optional(),
    anyOf: z.array(z.string()).optional(),
    present: z.literal(true).optional(),
  }),
]);

/** Validates one eval case (REQ-92, REQ-102, REQ-104, REQ-106). */
export const evalCaseSchema = z.object({
  id: z.string(),
  category: z.enum(CATEGORIES),
  tag: z.enum(HARD_TAGS).optional(),
  holdout: z.boolean().optional(),
  input: z.object({
    text: z.string(),
    timezone: z.string().nullable(),
    now: z.string(),
  }),
  expected: z.object({
    name: matcherSchema.optional(),
    description: matcherSchema.optional(),
    date: matcherSchema.optional(),
    time: matcherSchema.optional(),
    timezone: matcherSchema.optional(),
    location: matcherSchema.optional(),
    missing: z.array(z.enum(AI_FIELDS)).optional(),
    notAnEvent: z.boolean().optional(),
    forbiddenInDescription: z
      .array(z.string().refine(isValidPattern, 'not a valid regular expression'))
      .min(1)
      .optional(),
  }),
});

/** Validates the whole eval cases dataset (REQ-92). */
export const evalCasesSchema = z.array(evalCaseSchema);

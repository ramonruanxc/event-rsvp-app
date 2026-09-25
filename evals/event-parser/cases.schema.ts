import { z } from 'zod';
import { AI_FIELDS } from '@/lib/ai/types';
import { CATEGORIES } from './types';

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

/** Validates one eval case (REQ-92). */
export const evalCaseSchema = z.object({
  id: z.string(),
  category: z.enum(CATEGORIES),
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
  }),
});

/** Validates the whole eval cases dataset (REQ-92). */
export const evalCasesSchema = z.array(evalCaseSchema);

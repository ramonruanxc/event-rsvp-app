import type { AiField } from '@/lib/ai/types';

/** Categories covered by the event-parser evaluation dataset (REQ-91, REQ-92). */
export const CATEGORIES = [
  'explicit',
  'relative',
  'timezone',
  'day-rollover',
  'tz-override',
  'missing-timezone',
  'must-not-invent',
  'multilingual',
  'non-event',
  'prompt-injection',
] as const;
/** One of CATEGORIES. */
export type Category = (typeof CATEGORIES)[number];

/**
 * Describes how an expected field value is compared against the actual one:
 * a string compares equal (trim + lower-case), `null` requires a `null` actual value,
 * and an object checks the keys it holds (`includes`, `excludes`, `anyOf`, `present`).
 */
export type Matcher =
  | string
  | null
  | { includes?: string; excludes?: string; anyOf?: string[]; present?: true };

/** One case of the event-parser evaluation dataset. */
export interface EvalCase {
  id: string;
  category: Category;
  input: { text: string; timezone: string | null; now: string };
  expected: Partial<Record<AiField, Matcher>> & { missing?: AiField[]; notAnEvent?: boolean };
}

/** The outcome of scoring a single checked field of a case. */
export interface FieldResult {
  field: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
}

/** The outcome of scoring one eval case. */
export interface CaseResult {
  id: string;
  category: Category;
  passed: boolean;
  fields: FieldResult[];
  error?: string;
}

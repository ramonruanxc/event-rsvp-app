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

/** Kinds of hard cases added in Phase 8 (REQ-106). */
export const HARD_TAGS = [
  'vague-time',
  'partial-date',
  'weekday-date-conflict',
  'same-weekday-next',
  'month-year-rollover',
  'dst-gap',
  'ambiguous-tz-abbreviation',
  'offset-or-city',
  'mixed-language',
  'ambiguous-numeric-date',
  'past-event',
  'question-about-event',
  'injection-in-field',
  'fake-json-or-system',
  'foreign-or-base64-injection',
] as const;
/** One of HARD_TAGS. */
export type HardTag = (typeof HARD_TAGS)[number];

/**
 * Describes how an expected field value is compared against the actual one:
 * a string compares equal (trim + lower-case), `null` requires a `null` actual value,
 * and an object checks the keys it holds (`includes`, `excludes`, `anyOf`, `present`).
 */
export type Matcher =
  string | null | { includes?: string; excludes?: string; anyOf?: string[]; present?: true };

/** One case of the event-parser evaluation dataset (REQ-92, REQ-106). */
export interface EvalCase {
  id: string;
  category: Category;
  tag?: HardTag;
  holdout?: boolean;
  input: { text: string; timezone: string | null; now: string };
  expected: Partial<Record<AiField, Matcher>> & {
    missing?: AiField[];
    notAnEvent?: boolean;
    forbiddenInDescription?: string[];
  };
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

/** Aggregated pass rates over a set of case results, overall and per category. */
export interface Summary {
  total: number;
  passed: number;
  overall: number;
  byCategory: Record<Category, { total: number; passed: number; rate: number }>;
}

/** How one run ended: answered (`ok`, `invalid`) or unavailable (`timeout`, `outage`) (REQ-101). */
export type RunStatus = 'ok' | 'invalid' | 'timeout' | 'outage';
/** One run of one case. */
export interface RunResult {
  status: RunStatus;
  latencyMs: number;
  result: CaseResult;
}
/** Every run of one case and whether the case passes (REQ-100). */
export interface CaseRuns {
  id: string;
  category: Category;
  holdout: boolean;
  runs: RunResult[];
  passed: boolean;
}
/** Availability and latency over every run (REQ-101). */
export interface RunStats {
  runs: number;
  answered: number;
  timeouts: number;
  outages: number;
  availability: number;
  p95LatencyMs: number;
}
/** Pass rates of all, tuning and hold-out cases, plus run statistics (REQ-101, REQ-104). */
export interface EvalSummary {
  all: Summary;
  tuning: Summary;
  holdout: Summary;
  stats: RunStats;
}
/** One named check of the Phase 8 gate (REQ-103). */
export interface GateCheck {
  name: string;
  passed: boolean;
  detail: string;
}

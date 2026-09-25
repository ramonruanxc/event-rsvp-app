import { AI_FIELDS, type ParseEventResult } from '@/lib/ai/types';
import type { CaseResult, EvalCase, FieldResult, Matcher } from './types';

/** Trims and lower-cases a value for case/space-insensitive comparisons. */
function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** True when `a` and `b` hold the same strings, regardless of order. */
function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

/** True when actual matches the given matcher (REQ-91). */
export function matches(matcher: Matcher, actual: string | null): boolean {
  if (matcher === null) return actual === null;
  if (typeof matcher === 'string') {
    return actual !== null && normalize(actual) === normalize(matcher);
  }
  if (matcher.includes !== undefined) {
    if (actual === null || !normalize(actual).includes(normalize(matcher.includes))) return false;
  }
  if (matcher.excludes !== undefined) {
    if (actual !== null && normalize(actual).includes(normalize(matcher.excludes))) return false;
  }
  if (matcher.anyOf !== undefined) {
    const options = matcher.anyOf;
    if (actual === null || !options.some((option) => normalize(option) === normalize(actual))) {
      return false;
    }
  }
  if (matcher.present === true) {
    if (actual === null || normalize(actual).length === 0) return false;
  }
  return true;
}

/** Scores one eval case against a parser outcome (REQ-91). */
export function scoreCase(
  evalCase: EvalCase,
  outcome: ParseEventResult | { error: string },
): CaseResult {
  const isError = 'error' in outcome;
  const fields: FieldResult[] = [];

  for (const field of AI_FIELDS) {
    const expected = evalCase.expected[field];
    if (expected === undefined) continue;
    const actual = isError ? null : outcome.fields[field];
    fields.push({ field, passed: !isError && matches(expected, actual), expected, actual });
  }

  if (evalCase.expected.missing !== undefined) {
    const expected = evalCase.expected.missing;
    const actual = isError ? [] : outcome.missing;
    fields.push({ field: 'missing', passed: !isError && sameSet(expected, actual), expected, actual });
  }

  if (evalCase.expected.notAnEvent !== undefined) {
    const expected = evalCase.expected.notAnEvent;
    const actual = isError ? false : outcome.notAnEvent;
    fields.push({ field: 'notAnEvent', passed: !isError && actual === expected, expected, actual });
  }

  const passed = fields.every((f) => f.passed);
  const result: CaseResult = { id: evalCase.id, category: evalCase.category, passed, fields };
  if (isError) result.error = outcome.error;
  return result;
}

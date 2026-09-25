import type { ParseEventResult } from '@/lib/ai/types';
import type { CaseResult, EvalCase, Matcher } from './types';

/** True when actual matches the given matcher (REQ-91). */
export function matches(_matcher: Matcher, _actual: string | null): boolean {
  throw new Error('not implemented');
}

/** Scores one eval case against a parser outcome (REQ-91). */
export function scoreCase(
  _evalCase: EvalCase,
  _outcome: ParseEventResult | { error: string },
): CaseResult {
  throw new Error('not implemented');
}

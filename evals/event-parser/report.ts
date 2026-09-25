import type { CaseResult, Summary } from './types';

/** Renders the eval summary and results as a Markdown report (REQ-91). */
export function renderReport(
  _summary: Summary,
  _results: CaseResult[],
  _meta: { model: string; date: string },
): string {
  throw new Error('not implemented');
}

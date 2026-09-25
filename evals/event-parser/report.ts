import { pct } from './format';
import { gate } from './score';
import { CATEGORIES } from './types';
import type { CaseResult, CaseRuns, EvalSummary, Summary } from './types';

/** Renders the eval summary and results as a Markdown report (REQ-91). */
export function renderReport(
  summary: Summary,
  results: CaseResult[],
  meta: { model: string; date: string },
): string {
  const lines: string[] = [];
  lines.push(`# Event-parser eval — ${meta.model} — ${meta.date}`);
  lines.push('');
  lines.push(`**Gate:** ${gate(summary) ? 'PASS' : 'FAIL'}`);
  lines.push(`**Overall:** ${pct(summary.overall)} (${summary.passed}/${summary.total})`);
  lines.push('');
  lines.push('| Category | Passed | Total | Rate |');
  lines.push('|---|---|---|---|');
  for (const category of CATEGORIES) {
    const bucket = summary.byCategory[category];
    lines.push(`| ${category} | ${bucket.passed} | ${bucket.total} | ${pct(bucket.rate)} |`);
  }
  lines.push('');
  lines.push('## Failures');
  lines.push('');

  const failureLines: string[] = [];
  for (const result of results) {
    if (result.passed) continue;
    if (result.error !== undefined) {
      failureLines.push(`- ${result.id} — error: ${result.error}`);
      continue;
    }
    for (const field of result.fields) {
      if (field.passed) continue;
      failureLines.push(
        `- ${result.id} — ${field.field}: expected ${JSON.stringify(field.expected)}, got ${JSON.stringify(field.actual)}`,
      );
    }
  }
  lines.push(failureLines.length > 0 ? failureLines.join('\n') : 'None.');

  return lines.join('\n');
}

/** Renders the Phase 8 eval report; hold-out cases appear only as totals (REQ-104, REQ-105). */
export function renderEvalReport(
  _summary: EvalSummary,
  _cases: readonly CaseRuns[],
  _meta: { model: string; date: string; runs: number; reasoningEffort: string },
): string {
  throw new Error('not implemented');
}

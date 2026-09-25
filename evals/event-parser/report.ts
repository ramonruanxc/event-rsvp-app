import { pct, seconds } from './format';
import { gateChecks, gateEval } from './score';
import { CATEGORIES } from './types';
import type { CaseRuns, EvalSummary, Summary } from './types';

/** Markdown table of one summary, one row per CATEGORIES entry. */
function categoryTable(summary: Summary): string[] {
  const lines = ['| Category | Passed | Total | Rate |', '|---|---|---|---|'];
  for (const category of CATEGORIES) {
    const bucket = summary.byCategory[category];
    lines.push(`| ${category} | ${bucket.passed} | ${bucket.total} | ${pct(bucket.rate)} |`);
  }
  return lines;
}

/** Failure lines of the failing tuning cases, in dataset and run order (REQ-105). */
function failureLines(cases: readonly CaseRuns[]): string[] {
  const lines: string[] = [];
  for (const c of cases) {
    if (c.holdout || c.passed) continue;
    if (!c.runs.some((run) => run.status === 'ok' || run.status === 'invalid')) {
      lines.push(`- ${c.id} — no answered run`);
      continue;
    }
    c.runs.forEach((run, index) => {
      const prefix = `- ${c.id} — run ${index + 1} —`;
      if (run.status === 'invalid') {
        lines.push(`${prefix} invalid output: ${run.result.error ?? 'unknown'}`);
      } else if (run.status === 'ok' && !run.result.passed) {
        for (const f of run.result.fields) {
          if (!f.passed) {
            lines.push(
              `${prefix} ${f.field}: expected ${JSON.stringify(f.expected)}, got ${JSON.stringify(f.actual)}`,
            );
          }
        }
      }
    });
  }
  return lines;
}

/** Timed-out and outage runs of the tuning cases (REQ-101, REQ-105). */
function unavailableLines(cases: readonly CaseRuns[]): string[] {
  const lines: string[] = [];
  for (const c of cases) {
    if (c.holdout) continue;
    c.runs.forEach((run, index) => {
      if (run.status === 'timeout' || run.status === 'outage') {
        lines.push(`- ${c.id} — run ${index + 1} — ${run.status} after ${seconds(run.latencyMs)}`);
      }
    });
  }
  return lines;
}

/** Renders the Phase 8 eval report; hold-out cases appear only as totals (REQ-104, REQ-105). */
export function renderEvalReport(
  summary: EvalSummary,
  cases: readonly CaseRuns[],
  meta: { model: string; date: string; runs: number; reasoningEffort: string },
): string {
  const { all, tuning, holdout, stats } = summary;
  const failures = failureLines(cases);
  const unavailable = unavailableLines(cases);
  return [
    `# Event-parser eval — ${meta.model} — ${meta.date}`,
    '',
    `**Gate:** ${gateEval(summary) ? 'PASS' : 'FAIL'}`,
    `**Overall:** ${pct(all.overall)} (${all.passed}/${all.total})`,
    `**Runs per case:** ${meta.runs} · **Reasoning effort:** ${meta.reasoningEffort}`,
    `**Availability:** ${pct(stats.availability)} (${stats.answered}/${stats.runs} runs answered; timeouts: ${stats.timeouts}, outages: ${stats.outages})`,
    `**Latency p95:** ${seconds(stats.p95LatencyMs)} (limit 8.0 s)`,
    '',
    '## Gate checks',
    '',
    ...gateChecks(summary).map(
      (check) => `- ${check.passed ? 'PASS' : 'FAIL'} — ${check.name}: ${check.detail}`,
    ),
    '',
    '## All cases (gate)',
    '',
    ...categoryTable(all),
    '',
    '## Tuning set',
    '',
    `**Overall:** ${pct(tuning.overall)} (${tuning.passed}/${tuning.total})`,
    '',
    '## Hold-out set',
    '',
    `**Overall:** ${pct(holdout.overall)} (${holdout.passed}/${holdout.total})`,
    '',
    ...categoryTable(holdout),
    '',
    'Hold-out cases count in the gate; their ids, inputs and failures are never listed (REQ-104).',
    '',
    '## Failures (tuning set)',
    '',
    failures.length > 0 ? failures.join('\n') : 'None.',
    '',
    '## Unavailable runs (tuning set)',
    '',
    unavailable.length > 0 ? unavailable.join('\n') : 'None.',
  ].join('\n');
}

import { describe, expect, it } from 'vitest';
import { summarizeEval } from './score';
import { renderEvalReport } from './report';
import type { Category, CaseRuns, FieldResult, RunResult, RunStatus } from './types';

describe('renderEvalReport (REQ-105)', () => {
  const field = (
    name: string,
    passed: boolean,
    expected: unknown,
    actual: unknown,
  ): FieldResult => ({
    field: name,
    passed,
    expected,
    actual,
  });
  const ok = (
    id: string,
    category: Category,
    latencyMs: number,
    fields: FieldResult[] = [],
  ): RunResult => ({
    status: 'ok',
    latencyMs,
    result: { id, category, passed: fields.every((f) => f.passed), fields },
  });
  const down = (
    status: RunStatus,
    id: string,
    category: Category,
    latencyMs: number,
  ): RunResult => ({
    status,
    latencyMs,
    result: { id, category, passed: false, fields: [], error: 'AI_UNAVAILABLE' },
  });
  const CASES: CaseRuns[] = [
    {
      id: 'mni-01',
      category: 'must-not-invent',
      holdout: false,
      passed: true,
      runs: [
        ok('mni-01', 'must-not-invent', 1_000),
        ok('mni-01', 'must-not-invent', 1_200),
        down('timeout', 'mni-01', 'must-not-invent', 10_000),
      ],
    },
    {
      id: 'mni-02',
      category: 'must-not-invent',
      holdout: false,
      passed: false,
      runs: [
        ok('mni-02', 'must-not-invent', 900),
        ok('mni-02', 'must-not-invent', 1_100, [
          field('date', false, null, '2026-10-01'),
          field('time', true, null, null),
        ]),
        down('invalid', 'mni-02', 'must-not-invent', 800),
      ],
    },
    {
      id: 'pi-01',
      category: 'prompt-injection',
      holdout: false,
      passed: true,
      runs: [
        ok('pi-01', 'prompt-injection', 1_500),
        ok('pi-01', 'prompt-injection', 1_600),
        down('outage', 'pi-01', 'prompt-injection', 300),
      ],
    },
    {
      id: 'hold-01',
      category: 'explicit',
      holdout: true,
      passed: false,
      runs: [
        ok('hold-01', 'explicit', 2_000, [field('date', false, '2026-10-02', '2026-10-03')]),
        ok('hold-01', 'explicit', 2_100),
        ok('hold-01', 'explicit', 2_200),
      ],
    },
    {
      id: 'hold-02',
      category: 'explicit',
      holdout: true,
      passed: true,
      runs: [
        ok('hold-02', 'explicit', 1_300),
        ok('hold-02', 'explicit', 1_400),
        ok('hold-02', 'explicit', 1_700),
      ],
    },
  ];
  const META = {
    model: 'openrouter:google/gemini-3.8-flash',
    date: '2026-09-25',
    runs: 3,
    reasoningEffort: 'low',
  };

  it('REQ-105: the report shows the gate checks, availability, latency, both sets and the tuning failures', () => {
    const EXPECTED = `# Event-parser eval — openrouter:google/gemini-3.8-flash — 2026-09-25

**Gate:** FAIL
**Overall:** 60% (3/5)
**Runs per case:** 3 · **Reasoning effort:** low
**Availability:** 87% (13/15 runs answered; timeouts: 1, outages: 1)
**Latency p95:** 10.0 s (limit 8.0 s)

## Gate checks

- FAIL — overall ≥ 90%: 60%
- FAIL — every category ≥ 80%: below 80%: explicit 50%, must-not-invent 50%
- FAIL — must-not-invent = 100%: 50%
- PASS — prompt-injection = 100%: 100%
- FAIL — p95 latency < 8 s: 10.0 s

## All cases (gate)

| Category | Passed | Total | Rate |
|---|---|---|---|
| explicit | 1 | 2 | 50% |
| relative | 0 | 0 | 100% |
| timezone | 0 | 0 | 100% |
| day-rollover | 0 | 0 | 100% |
| tz-override | 0 | 0 | 100% |
| missing-timezone | 0 | 0 | 100% |
| must-not-invent | 1 | 2 | 50% |
| multilingual | 0 | 0 | 100% |
| non-event | 0 | 0 | 100% |
| prompt-injection | 1 | 1 | 100% |

## Tuning set

**Overall:** 67% (2/3)

## Hold-out set

**Overall:** 50% (1/2)

| Category | Passed | Total | Rate |
|---|---|---|---|
| explicit | 1 | 2 | 50% |
| relative | 0 | 0 | 100% |
| timezone | 0 | 0 | 100% |
| day-rollover | 0 | 0 | 100% |
| tz-override | 0 | 0 | 100% |
| missing-timezone | 0 | 0 | 100% |
| must-not-invent | 0 | 0 | 100% |
| multilingual | 0 | 0 | 100% |
| non-event | 0 | 0 | 100% |
| prompt-injection | 0 | 0 | 100% |

Hold-out cases count in the gate; their ids, inputs and failures are never listed (REQ-104).

## Failures (tuning set)

- mni-02 — run 2 — date: expected null, got "2026-10-01"
- mni-02 — run 3 — invalid output: AI_UNAVAILABLE

## Unavailable runs (tuning set)

- mni-01 — run 3 — timeout after 10.0 s
- pi-01 — run 3 — outage after 0.3 s`;
    expect(renderEvalReport(summarizeEval(CASES), CASES, META)).toBe(EXPECTED);
  });

  it('REQ-104: the report never lists a hold-out case', () => {
    const md = renderEvalReport(summarizeEval(CASES), CASES, META);
    expect(md).not.toContain('hold-01');
    expect(md).not.toContain('hold-02');
  });

  it('REQ-105: a tuning case without an answered run is listed once, and an all-clear list says None.', () => {
    const lost: CaseRuns[] = [
      {
        id: 'relative-01',
        category: 'relative',
        holdout: false,
        passed: false,
        runs: [
          down('timeout', 'relative-01', 'relative', 10_000),
          down('outage', 'relative-01', 'relative', 200),
        ],
      },
    ];
    const lostMd = renderEvalReport(summarizeEval(lost), lost, META);
    expect(lostMd).toContain('- relative-01 — no answered run');
    expect(lostMd).toContain('- relative-01 — run 1 — timeout after 10.0 s');
    expect(lostMd).toContain('- relative-01 — run 2 — outage after 0.2 s');

    const clean: CaseRuns[] = [
      {
        id: 'explicit-01',
        category: 'explicit',
        holdout: false,
        passed: true,
        runs: [ok('explicit-01', 'explicit', 1_000)],
      },
    ];
    const cleanMd = renderEvalReport(summarizeEval(clean), clean, META);
    expect(cleanMd).toContain('**Gate:** PASS');
    expect(cleanMd).toContain('## Failures (tuning set)\n\nNone.');
    expect(cleanMd).toContain('## Unavailable runs (tuning set)\n\nNone.');
  });
});

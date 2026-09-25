import { describe, expect, it } from 'vitest';
import { summarize } from './score';
import { renderReport } from './report';
import type { CaseResult } from './types';

describe('renderReport (REQ-91)', () => {
  it('REQ-91: the report has title, gate, category table and failures', () => {
    const results: CaseResult[] = [
      {
        id: 'mni-01',
        category: 'must-not-invent',
        passed: true,
        fields: [{ field: 'date', passed: true, expected: null, actual: null }],
      },
      {
        id: 'mni-02',
        category: 'must-not-invent',
        passed: false,
        fields: [
          { field: 'date', passed: false, expected: null, actual: '2026-10-01' },
          { field: 'time', passed: true, expected: null, actual: null },
        ],
      },
      { id: 'mni-03', category: 'must-not-invent', passed: true, fields: [] },
      { id: 'mni-04', category: 'must-not-invent', passed: true, fields: [] },
      {
        id: 'pi-01',
        category: 'prompt-injection',
        passed: false,
        fields: [],
        error: 'AI_UNAVAILABLE',
      },
    ];
    const md = renderReport(summarize(results), results, {
      model: 'claude-haiku-4-5',
      date: '2026-09-24',
    });

    expect(md).toContain('# Event-parser eval — claude-haiku-4-5 — 2026-09-24');
    expect(md).toContain('**Gate:** FAIL');
    expect(md).toContain('**Overall:** 60% (3/5)');
    expect(md).toContain('| Category | Passed | Total | Rate |');
    expect(md).toContain('| must-not-invent | 3 | 4 | 75% |');
    expect(md).toContain('| prompt-injection | 0 | 1 | 0% |');
    expect(md).toContain('| explicit | 0 | 0 | 100% |');
    expect(md).toContain('## Failures');
    expect(md).toContain('- mni-02 — date: expected null, got "2026-10-01"');
    expect(md).toContain('- pi-01 — error: AI_UNAVAILABLE');
    expect(md).not.toContain('mni-02 — time');
    expect(md).not.toContain('mni-01 —');
  });

  it('REQ-91: a passing run says PASS and lists no failures', () => {
    const ok: CaseResult[] = [{ id: 'explicit-01', category: 'explicit', passed: true, fields: [] }];
    const md = renderReport(summarize(ok), ok, { model: 'claude-haiku-4-5', date: '2026-09-24' });

    expect(md).toContain('**Gate:** PASS');
    expect(md).toContain('## Failures\n\nNone.');
  });
});

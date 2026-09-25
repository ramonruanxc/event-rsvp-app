import { describe, expect, it } from 'vitest';
import { InvalidModelOutputError, ProviderUnavailableError } from '@/lib/ai/errors';
import type { ParseEventResult } from '@/lib/ai/types';
import { aggregateRuns, classifyRun } from './runs';
import type { EvalCase, RunResult, RunStatus } from './types';

const resultOn = (date: string): ParseEventResult => ({
  fields: {
    name: 'Team dinner',
    description: 'Dinner with the team.',
    date,
    time: '19:00',
    timezone: 'America/New_York',
    location: null,
  },
  missing: ['location'],
  timezoneFromText: false,
  notAnEvent: false,
});
const FAILED = { error: 'AI_UNAVAILABLE' };

describe('classifyRun (REQ-101)', () => {
  it('REQ-101: a result is ok; a failure is classified by latency, then by the client error', () => {
    const table: [Parameters<typeof classifyRun>[0], RunStatus][] = [
      [{ outcome: resultOn('2026-10-02'), latencyMs: 1_200, clientError: undefined }, 'ok'],
      [{ outcome: FAILED, latencyMs: 10_000, clientError: undefined }, 'timeout'],
      [
        {
          outcome: FAILED,
          latencyMs: 10_450,
          clientError: new InvalidModelOutputError('model content is not JSON'),
        },
        'timeout',
      ],
      [{ outcome: FAILED, latencyMs: 9_999, clientError: undefined }, 'invalid'],
      [
        { outcome: FAILED, latencyMs: 800, clientError: new ProviderUnavailableError('timeout') },
        'timeout',
      ],
      [
        {
          outcome: FAILED,
          latencyMs: 300,
          clientError: new ProviderUnavailableError('rate-limit'),
        },
        'outage',
      ],
      [
        { outcome: FAILED, latencyMs: 300, clientError: new ProviderUnavailableError('server') },
        'outage',
      ],
      [
        {
          outcome: FAILED,
          latencyMs: 700,
          clientError: new InvalidModelOutputError('model returned no content'),
        },
        'invalid',
      ],
      [
        { outcome: FAILED, latencyMs: 400, clientError: new Error('OpenRouter HTTP 404') },
        'invalid',
      ],
    ];
    for (const [run, status] of table) expect(classifyRun(run), `${run.latencyMs} ms`).toBe(status);
  });
});

const CASE: EvalCase = {
  id: 'c1',
  category: 'explicit',
  input: {
    text: 'Team dinner on October 2, 2026 at 7pm',
    timezone: 'America/New_York',
    now: '2026-09-24T15:00:00Z',
  },
  expected: { date: '2026-10-02' },
};
const runOf = (status: RunStatus, passed: boolean): RunResult => ({
  status,
  latencyMs: 1_000,
  result: { id: 'c1', category: 'explicit', passed, fields: [] },
});

describe('aggregateRuns (REQ-100, REQ-101)', () => {
  it('REQ-100: a case passes only if every answered run is ok and passes', () => {
    const three = [runOf('ok', true), runOf('ok', true), runOf('ok', true)];
    expect(aggregateRuns(CASE, three)).toEqual({
      id: 'c1',
      category: 'explicit',
      holdout: false,
      runs: three,
      passed: true,
    });
    expect(
      aggregateRuns(CASE, [runOf('ok', true), runOf('ok', true), runOf('ok', false)]).passed,
    ).toBe(false);
    expect(
      aggregateRuns(CASE, [runOf('invalid', false), runOf('ok', true), runOf('ok', true)]).passed,
    ).toBe(false);
  });

  it('REQ-101: unavailable runs are not scored, but a case needs one answered run', () => {
    expect(
      aggregateRuns(CASE, [runOf('timeout', false), runOf('ok', true), runOf('outage', false)])
        .passed,
    ).toBe(true);
    expect(
      aggregateRuns(CASE, [
        runOf('timeout', false),
        runOf('timeout', false),
        runOf('outage', false),
      ]).passed,
    ).toBe(false);
    expect(aggregateRuns({ ...CASE, holdout: true }, [runOf('ok', true)]).holdout).toBe(true);
  });
});

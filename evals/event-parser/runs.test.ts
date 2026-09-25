import { describe, expect, it, vi } from 'vitest';
import { AiUnavailableError } from '@/domain/errors';
import { InvalidModelOutputError, ProviderUnavailableError } from '@/lib/ai/errors';
import type { ParseEventResult } from '@/lib/ai/types';
import { aggregateRuns, classifyRun, recordingClient, runCase } from './runs';
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
      [{ outcome: FAILED, latencyMs: 20_000, clientError: undefined }, 'timeout'],
      [
        {
          outcome: FAILED,
          latencyMs: 20_450,
          clientError: new InvalidModelOutputError('model content is not JSON'),
        },
        'timeout',
      ],
      [{ outcome: FAILED, latencyMs: 19_999, clientError: undefined }, 'invalid'],
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

  it('REQ-132: an AI_TIMEOUT failure is a timeout whatever its latency', () => {
    expect(
      classifyRun({ outcome: { error: 'AI_TIMEOUT' }, latencyMs: 1_500, clientError: undefined }),
    ).toBe('timeout');
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

const clockOf =
  (...ticks: number[]) =>
  () => {
    const tick = ticks.shift();
    if (tick === undefined) throw new Error('clock exhausted');
    return tick;
  };

describe('recordingClient (REQ-101)', () => {
  it('REQ-101: the recording client passes calls through and hands over its last error once', async () => {
    const outage = new ProviderUnavailableError('server');
    const complete = vi.fn().mockResolvedValueOnce({ a: 1 }).mockRejectedValueOnce(outage);
    const recorder = recordingClient({ complete });
    const request = { system: 's', user: 'u', model: 'm', timeoutMs: 5_000 };
    await expect(recorder.client.complete(request)).resolves.toEqual({ a: 1 });
    expect(complete).toHaveBeenCalledWith(request);
    expect(recorder.takeError()).toBeUndefined();
    await expect(recorder.client.complete(request)).rejects.toBe(outage);
    expect(recorder.takeError()).toBe(outage);
    expect(recorder.takeError()).toBeUndefined();
  });
});

describe('runCase (REQ-100, REQ-101)', () => {
  it('REQ-100: runCase sends the case input once per run and scores every run', async () => {
    const parse = vi
      .fn()
      .mockResolvedValueOnce(resultOn('2026-10-02'))
      .mockResolvedValueOnce(resultOn('2026-10-02'))
      .mockResolvedValueOnce(resultOn('2026-10-03'));
    const takeClientError = vi.fn(() => undefined);
    const out = await runCase(CASE, 3, {
      parse,
      takeClientError,
      clock: clockOf(0, 1_000, 1_000, 3_000, 3_000, 6_000),
    });

    expect(parse).toHaveBeenCalledTimes(3);
    for (let i = 1; i <= 3; i += 1) {
      expect(parse).toHaveBeenNthCalledWith(i, {
        text: 'Team dinner on October 2, 2026 at 7pm',
        formTimezone: 'America/New_York',
        now: new Date('2026-09-24T15:00:00Z'),
      });
    }
    expect(takeClientError).toHaveBeenCalledTimes(3);
    expect(out.runs.map((r) => [r.status, r.latencyMs, r.result.passed])).toEqual([
      ['ok', 1_000, true],
      ['ok', 2_000, true],
      ['ok', 3_000, false],
    ]);
    expect(out).toMatchObject({ id: 'c1', category: 'explicit', holdout: false, passed: false });
  });

  it('REQ-101: runCase classifies a slow failure as timeout and a fast outage as outage, and does not score them', async () => {
    const parse = vi
      .fn()
      .mockRejectedValueOnce(new AiUnavailableError())
      .mockResolvedValueOnce(resultOn('2026-10-02'))
      .mockRejectedValueOnce(new AiUnavailableError());
    const takeClientError = vi
      .fn()
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(new ProviderUnavailableError('rate-limit'));
    const out = await runCase(CASE, 3, {
      parse,
      takeClientError,
      clock: clockOf(0, 20_000, 20_000, 22_000, 22_000, 22_300),
    });

    expect(out.runs.map((r) => [r.status, r.latencyMs])).toEqual([
      ['timeout', 20_000],
      ['ok', 2_000],
      ['outage', 300],
    ]);
    expect(out.runs[0].result.error).toBe('AI_UNAVAILABLE');
    expect(out.passed).toBe(true);
  });

  it('REQ-101: runCase counts a fast failure without an outage as invalid output', async () => {
    const parse = vi
      .fn()
      .mockRejectedValueOnce(new AiUnavailableError())
      .mockRejectedValueOnce(new Error('boom'));
    const takeClientError = vi
      .fn()
      .mockReturnValueOnce(new InvalidModelOutputError('model content is not JSON'))
      .mockReturnValueOnce(undefined);
    const out = await runCase(CASE, 2, {
      parse,
      takeClientError,
      clock: clockOf(0, 700, 700, 800),
    });

    expect(out.runs.map((r) => r.status)).toEqual(['invalid', 'invalid']);
    expect(out.runs[1].result.error).toBe('Error: boom');
    expect(out.passed).toBe(false);
  });

  it('REQ-100: runCase fails a case whose runs all time out', async () => {
    const parse = vi.fn().mockRejectedValue(new AiUnavailableError());
    const takeClientError = vi.fn(() => undefined);
    const out = await runCase(CASE, 2, {
      parse,
      takeClientError,
      clock: clockOf(0, 20_000, 20_000, 40_000),
    });

    expect(out.runs.map((r) => r.status)).toEqual(['timeout', 'timeout']);
    expect(out.passed).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { InvalidModelOutputError, ProviderUnavailableError } from '@/lib/ai/errors';
import type { ParseEventResult } from '@/lib/ai/types';
import { classifyRun } from './runs';
import type { RunStatus } from './types';

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

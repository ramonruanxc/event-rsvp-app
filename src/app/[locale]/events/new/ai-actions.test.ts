import { describe, expect, test, vi } from 'vitest';
import { AiLimitReachedError } from '@/domain/errors';

const mocks = vi.hoisted(() => ({ userId: null as string | null, execute: vi.fn() }));
vi.mock('@/lib/session', () => ({ getCurrentUserId: async () => mocks.userId }));
vi.mock('@/lib/container', () => ({
  getServices: () => ({ parseEventText: { execute: mocks.execute } }),
}));

import { parseEventTextAction } from './ai-actions';

describe('parseEventTextAction', () => {
  test('REQ-49: without a session the action refuses and does not call the service', async () => {
    mocks.userId = null;

    const result = await parseEventTextAction('Dinner', 'UTC');

    expect(result).toEqual({ ok: false, code: 'UNAUTHENTICATED' });
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  test('REQ-49: with a session it returns the parse result', async () => {
    mocks.userId = 'u1';
    const result = {
      fields: {
        name: 'Team dinner',
        description: 'Dinner with the team.',
        date: '2026-10-02',
        time: '19:00',
        timezone: 'UTC',
        location: "Mario's",
      },
      missing: [],
      timezoneFromText: false,
      notAnEvent: false,
    };
    mocks.execute.mockResolvedValueOnce(result);

    const actionResult = await parseEventTextAction('Dinner', 'UTC');

    expect(actionResult).toEqual({ ok: true, data: result });
    expect(mocks.execute).toHaveBeenCalledWith({ userId: 'u1', text: 'Dinner', timezone: 'UTC' });
  });

  test('REQ-49: service errors are mapped', async () => {
    mocks.userId = 'u1';
    mocks.execute.mockRejectedValueOnce(new AiLimitReachedError());

    const result = await parseEventTextAction('Dinner', 'UTC');

    expect(result).toEqual({ ok: false, code: 'AI_LIMIT_REACHED' });
  });
});

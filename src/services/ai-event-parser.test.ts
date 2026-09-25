import { describe, expect, it, vi } from 'vitest';
import { AiUnavailableError } from '@/domain/errors';
import { SYSTEM_PROMPT } from '@/lib/ai/prompt';
import { AiEventParser } from './ai-event-parser';

describe('AiEventParser', () => {
  it('REQ-45: returns the model fields with the form timezone and no missing field', async () => {
    const complete = vi.fn().mockResolvedValue({
      isEvent: true,
      name: 'Team dinner',
      description: 'Dinner with the team.',
      date: '2026-10-02',
      time: '19:00',
      timezone: null,
      location: "Mario's",
    });
    const parser = new AiEventParser({
      providers: [{ name: 'anthropic', client: { complete }, model: 'claude-haiku-4-5' }],
    });

    const result = await parser.parse({
      text: "Team dinner next Friday 7pm at Mario's",
      formTimezone: 'America/New_York',
      now: new Date('2026-09-24T15:00:00.000Z'),
    });

    expect(result).toEqual({
      fields: {
        name: 'Team dinner',
        description: 'Dinner with the team.',
        date: '2026-10-02',
        time: '19:00',
        timezone: 'America/New_York',
        location: "Mario's",
      },
      missing: [],
      timezoneFromText: false,
      notAnEvent: false,
    });
  });

  it('REQ-45: sends the system prompt, the delimited text and the model', async () => {
    const complete = vi.fn().mockResolvedValue({
      isEvent: true,
      name: null,
      description: null,
      date: null,
      time: null,
      timezone: null,
      location: null,
    });
    const parser = new AiEventParser({
      providers: [{ name: 'anthropic', client: { complete }, model: 'claude-haiku-4-5' }],
    });

    await parser.parse({
      text: 'Dinner',
      formTimezone: null,
      now: new Date('2026-09-24T15:00:00.000Z'),
    });

    expect(complete).toHaveBeenCalledWith({
      system: SYSTEM_PROMPT,
      user: expect.stringContaining('<event_text>'),
      model: 'claude-haiku-4-5',
    });
  });

  it('REQ-47: a client error becomes AiUnavailableError', async () => {
    const complete = vi.fn().mockRejectedValue(new Error('boom'));
    const parser = new AiEventParser({
      providers: [{ name: 'anthropic', client: { complete }, model: 'claude-haiku-4-5' }],
    });

    await expect(
      parser.parse({ text: 'Dinner', formTimezone: null, now: new Date() }),
    ).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it('REQ-47: no answer within 10 seconds becomes AiUnavailableError', async () => {
    vi.useFakeTimers();
    const complete = vi.fn().mockReturnValue(new Promise(() => {}));
    const parser = new AiEventParser({
      providers: [{ name: 'anthropic', client: { complete }, model: 'claude-haiku-4-5' }],
    });

    const assertion = expect(
      parser.parse({ text: 'Dinner', formTimezone: null, now: new Date() }),
    ).rejects.toBeInstanceOf(AiUnavailableError);
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    vi.useRealTimers();
  });
});

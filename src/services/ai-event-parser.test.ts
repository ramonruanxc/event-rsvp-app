import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiUnavailableError } from '@/domain/errors';
import { InvalidModelOutputError, ProviderUnavailableError } from '@/lib/ai/errors';
import { SYSTEM_PROMPT } from '@/lib/ai/prompt';
import type { AiModelClient, AiProvider, AiProviderName, ParseEventResult } from '@/lib/ai/types';
import { AiEventParser } from './ai-event-parser';

const RAW = {
  isEvent: true,
  name: 'Team dinner',
  description: 'Dinner with the team.',
  date: '2026-10-02',
  time: '19:00',
  timezone: null,
  location: "Mario's",
};
// RAW + form timezone 'America/New_York' → timezone from the form, nothing missing (REQ-45, REQ-46)
const EXPECTED: ParseEventResult = {
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
};
const REQUEST = {
  text: "Team dinner next Friday 7pm at Mario's",
  formTimezone: 'America/New_York',
  now: new Date('2026-09-24T15:00:00.000Z'),
};
const provider = (
  name: AiProviderName,
  complete: AiModelClient['complete'],
  model: string,
): AiProvider => ({
  name,
  client: { complete },
  model,
});

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
      clock: () => 0,
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
      timeoutMs: 10_000,
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

describe('AiEventParser — providers', () => {
  let t = 0;
  const clock = () => t;
  beforeEach(() => {
    t = 0;
  });

  it('REQ-88: when the first provider is down, the next provider answers', async () => {
    const anthropic = vi.fn().mockRejectedValue(new ProviderUnavailableError('server'));
    const openrouter = vi.fn().mockResolvedValue(RAW);
    const parser = new AiEventParser({
      providers: [
        provider('anthropic', anthropic, 'claude-haiku-4-5'),
        provider('openrouter', openrouter, 'anthropic/claude-haiku-4.5'),
      ],
    });

    await expect(parser.parse(REQUEST)).resolves.toEqual(EXPECTED);
    expect(anthropic).toHaveBeenCalledTimes(1);
    expect(openrouter).toHaveBeenCalledTimes(1);
    expect(openrouter).toHaveBeenCalledWith(
      expect.objectContaining({ system: SYSTEM_PROMPT, model: 'anthropic/claude-haiku-4.5' }),
    );
    expect(anthropic.mock.invocationCallOrder[0]).toBeLessThan(
      openrouter.mock.invocationCallOrder[0],
    );

    // the first provider that answers wins; later providers are not called (REQ-86)
    const first = vi.fn().mockResolvedValue(RAW);
    const second = vi.fn().mockResolvedValue(RAW);
    await new AiEventParser({
      providers: [provider('anthropic', first, 'm1'), provider('openrouter', second, 'm2')],
    }).parse(REQUEST);
    expect(second).not.toHaveBeenCalled();
  });

  it('REQ-88: an invalid or unauthorized key (auth) on the first provider lets the next provider answer', async () => {
    const a1 = vi.fn().mockRejectedValue(new ProviderUnavailableError('auth'));
    const o1 = vi.fn().mockResolvedValue(RAW);
    const parser1 = new AiEventParser({
      providers: [
        provider('anthropic', a1, 'claude-haiku-4-5'),
        provider('openrouter', o1, 'anthropic/claude-haiku-4.5'),
      ],
    });
    await expect(parser1.parse(REQUEST)).resolves.toEqual(EXPECTED);
    expect(a1).toHaveBeenCalledTimes(1);
    expect(o1).toHaveBeenCalledTimes(1);

    const o2 = vi.fn().mockRejectedValue(new ProviderUnavailableError('auth'));
    const a2 = vi.fn().mockResolvedValue(RAW);
    const parser2 = new AiEventParser({
      providers: [
        provider('openrouter', o2, 'anthropic/claude-haiku-4.5'),
        provider('anthropic', a2, 'claude-haiku-4-5'),
      ],
    });
    await expect(parser2.parse(REQUEST)).resolves.toEqual(EXPECTED);
    expect(o2).toHaveBeenCalledTimes(1);
    expect(a2).toHaveBeenCalledTimes(1);
  });

  it('REQ-88: when every provider is down, the fill is unavailable', async () => {
    const anthropic = vi.fn().mockRejectedValue(new ProviderUnavailableError('credit'));
    const openrouter = vi.fn().mockRejectedValue(new ProviderUnavailableError('rate-limit'));
    const parser = new AiEventParser({
      providers: [
        provider('anthropic', anthropic, 'claude-haiku-4-5'),
        provider('openrouter', openrouter, 'anthropic/claude-haiku-4.5'),
      ],
    });

    await expect(parser.parse(REQUEST)).rejects.toBeInstanceOf(AiUnavailableError);
    expect(anthropic).toHaveBeenCalledTimes(1);
    expect(openrouter).toHaveBeenCalledTimes(1);
  });

  it('REQ-89: output that fails the schema is not retried on another provider', async () => {
    const anthropic = vi.fn().mockResolvedValue({ foo: 1 });
    const openrouter = vi.fn().mockResolvedValue(RAW);
    const parser = new AiEventParser({
      providers: [
        provider('anthropic', anthropic, 'claude-haiku-4-5'),
        provider('openrouter', openrouter, 'anthropic/claude-haiku-4.5'),
      ],
    });

    await expect(parser.parse(REQUEST)).rejects.toBeInstanceOf(AiUnavailableError);
    expect(openrouter).not.toHaveBeenCalled();
  });

  it('REQ-89: a client error that is not an outage is not retried', async () => {
    for (const error of [
      new InvalidModelOutputError('model returned no structured output'),
      new Error('OpenRouter HTTP 404'),
    ]) {
      const anthropic = vi.fn().mockRejectedValue(error);
      const openrouter = vi.fn().mockResolvedValue(RAW);
      const parser = new AiEventParser({
        providers: [
          provider('anthropic', anthropic, 'claude-haiku-4-5'),
          provider('openrouter', openrouter, 'anthropic/claude-haiku-4.5'),
        ],
      });

      await expect(parser.parse(REQUEST)).rejects.toBeInstanceOf(AiUnavailableError);
      expect(openrouter).not.toHaveBeenCalled();
    }
  });

  it('REQ-88: the next provider only gets the time left in the budget', async () => {
    const anthropic = vi.fn(async () => {
      t = 3_000;
      throw new ProviderUnavailableError('rate-limit');
    });
    const openrouter = vi.fn().mockResolvedValue(RAW);
    const parser = new AiEventParser({
      providers: [
        provider('anthropic', anthropic, 'claude-haiku-4-5'),
        provider('openrouter', openrouter, 'anthropic/claude-haiku-4.5'),
      ],
      clock,
    });

    await expect(parser.parse(REQUEST)).resolves.toEqual(EXPECTED);
    expect(anthropic).toHaveBeenCalledWith(expect.objectContaining({ timeoutMs: 10_000 }));
    expect(openrouter).toHaveBeenCalledWith(expect.objectContaining({ timeoutMs: 7_000 }));
  });

  it('REQ-88: no provider is tried with less than one second left', async () => {
    const anthropic1 = vi.fn(async () => {
      t = 9_001;
      throw new ProviderUnavailableError('server');
    });
    const openrouter1 = vi.fn().mockResolvedValue(RAW);
    const parser1 = new AiEventParser({
      providers: [
        provider('anthropic', anthropic1, 'claude-haiku-4-5'),
        provider('openrouter', openrouter1, 'anthropic/claude-haiku-4.5'),
      ],
      clock,
    });
    await expect(parser1.parse(REQUEST)).rejects.toBeInstanceOf(AiUnavailableError);
    expect(openrouter1).not.toHaveBeenCalled();

    t = 0;
    const anthropic2 = vi.fn(async () => {
      t = 9_000;
      throw new ProviderUnavailableError('server');
    });
    const openrouter2 = vi.fn().mockResolvedValue(RAW);
    const parser2 = new AiEventParser({
      providers: [
        provider('anthropic', anthropic2, 'claude-haiku-4-5'),
        provider('openrouter', openrouter2, 'anthropic/claude-haiku-4.5'),
      ],
      clock,
    });
    await expect(parser2.parse(REQUEST)).resolves.toEqual(EXPECTED);
    expect(openrouter2).toHaveBeenCalledWith(expect.objectContaining({ timeoutMs: 1_000 }));
  });

  it('REQ-88: a provider that never answers uses the whole budget', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const anthropic = vi.fn().mockReturnValue(new Promise(() => {}));
    const openrouter = vi.fn().mockResolvedValue(RAW);
    const parser = new AiEventParser({
      providers: [provider('anthropic', anthropic, 'm1'), provider('openrouter', openrouter, 'm2')],
    });

    const assertion = expect(parser.parse(REQUEST)).rejects.toBeInstanceOf(AiUnavailableError);
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(openrouter).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

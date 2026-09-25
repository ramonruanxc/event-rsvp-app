import { describe, expect, it, vi } from 'vitest';
import { AiLimitReachedError, AiUnavailableError, ValidationError } from '@/domain/errors';
import { ProviderUnavailableError } from '@/lib/ai/errors';
import type { AiModelClient, EventTextParser, ParseEventResult } from '@/lib/ai/types';
import { createMemoryStore } from '@/repositories/memory/memory-store';
import { MemoryRateLimitRepository } from '@/repositories/memory/memory-rate-limit-repository';
import { AiEventParser } from './ai-event-parser';
import { RateLimiter } from './rate-limiter';
import { ParseEventTextService } from './parse-event-text';

const result: ParseEventResult = {
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

describe('ParseEventTextService', () => {
  it('REQ-48: the 21st call of the day is refused without calling the AI', async () => {
    const parser: EventTextParser = { parse: vi.fn().mockResolvedValue(result) };
    const current = new Date('2026-09-24T23:59:00.000Z');
    const rateLimiter = new RateLimiter({
      repo: new MemoryRateLimitRepository(createMemoryStore()),
      now: () => current,
    });
    const service = new ParseEventTextService({ parser, rateLimiter, now: () => current });
    const call = (userId = 'u1') => service.execute({ userId, text: 'Dinner', timezone: 'UTC' });

    for (let i = 1; i <= 20; i++) {
      await expect(call()).resolves.toEqual(result);
    }
    await expect(call()).rejects.toBeInstanceOf(AiLimitReachedError);
    expect(parser.parse).toHaveBeenCalledTimes(20);
  });

  it('REQ-48: the limit resets at 00:00 UTC', async () => {
    const parser: EventTextParser = { parse: vi.fn().mockResolvedValue(result) };
    let current = new Date('2026-09-24T23:59:00.000Z');
    const rateLimiter = new RateLimiter({
      repo: new MemoryRateLimitRepository(createMemoryStore()),
      now: () => current,
    });
    const service = new ParseEventTextService({ parser, rateLimiter, now: () => current });
    const call = (userId = 'u1') => service.execute({ userId, text: 'Dinner', timezone: 'UTC' });

    for (let i = 1; i <= 20; i++) {
      await expect(call()).resolves.toEqual(result);
    }
    await expect(call()).rejects.toBeInstanceOf(AiLimitReachedError);

    current = new Date('2026-09-25T00:00:00.000Z');
    await expect(call()).resolves.toEqual(result);
    expect(parser.parse).toHaveBeenCalledTimes(21);
  });

  it('REQ-48: users have separate limits', async () => {
    const parser: EventTextParser = { parse: vi.fn().mockResolvedValue(result) };
    const current = new Date('2026-09-24T23:59:00.000Z');
    const rateLimiter = new RateLimiter({
      repo: new MemoryRateLimitRepository(createMemoryStore()),
      now: () => current,
    });
    const service = new ParseEventTextService({ parser, rateLimiter, now: () => current });
    const call = (userId = 'u1') => service.execute({ userId, text: 'Dinner', timezone: 'UTC' });

    for (let i = 1; i <= 20; i++) {
      await expect(call('u1')).resolves.toEqual(result);
    }
    await expect(call('u2')).resolves.toEqual(result);
  });

  it('REQ-48: failed AI calls still count', async () => {
    const parser: EventTextParser = {
      parse: vi.fn().mockRejectedValue(new AiUnavailableError()),
    };
    const current = new Date('2026-09-24T23:59:00.000Z');
    const rateLimiter = new RateLimiter({
      repo: new MemoryRateLimitRepository(createMemoryStore()),
      now: () => current,
    });
    const service = new ParseEventTextService({ parser, rateLimiter, now: () => current });
    const call = (userId = 'u1') => service.execute({ userId, text: 'Dinner', timezone: 'UTC' });

    for (let i = 1; i <= 20; i++) {
      await expect(call()).rejects.toBeInstanceOf(AiUnavailableError);
    }
    await expect(call()).rejects.toBeInstanceOf(AiLimitReachedError);
  });

  it('REQ-48: rejects blank text without calling the AI', async () => {
    const parser: EventTextParser = { parse: vi.fn() };
    const rateLimiter = new RateLimiter({
      repo: new MemoryRateLimitRepository(createMemoryStore()),
      now: () => new Date('2026-09-24T23:59:00.000Z'),
    });
    const service = new ParseEventTextService({
      parser,
      rateLimiter,
      now: () => new Date('2026-09-24T23:59:00.000Z'),
    });

    await expect(
      service.execute({ userId: 'u1', text: '   ', timezone: 'UTC' }),
    ).rejects.toMatchObject(new ValidationError({ text: 'required' }));
    expect(parser.parse).not.toHaveBeenCalled();
  });

  it('REQ-48: rejects text longer than 2000 characters without calling the AI', async () => {
    const parser: EventTextParser = { parse: vi.fn() };
    const rateLimiter = new RateLimiter({
      repo: new MemoryRateLimitRepository(createMemoryStore()),
      now: () => new Date('2026-09-24T23:59:00.000Z'),
    });
    const service = new ParseEventTextService({
      parser,
      rateLimiter,
      now: () => new Date('2026-09-24T23:59:00.000Z'),
    });

    await expect(
      service.execute({ userId: 'u1', text: 'a'.repeat(2001), timezone: 'UTC' }),
    ).rejects.toMatchObject(new ValidationError({ text: 'tooLong' }));
    expect(parser.parse).not.toHaveBeenCalled();
  });
});

describe('ParseEventTextService — failover (REQ-96)', () => {
  const RAW = {
    isEvent: true,
    name: 'Team dinner',
    description: 'Dinner with the team.',
    date: '2026-10-02',
    time: '19:00',
    timezone: null,
    location: "Mario's",
  };
  const setup = (anthropic: AiModelClient['complete'], openrouter: AiModelClient['complete']) => {
    const now = () => new Date('2026-09-24T12:00:00.000Z');
    const parser = new AiEventParser({
      providers: [
        { name: 'anthropic', client: { complete: anthropic }, model: 'claude-haiku-4-5' },
        {
          name: 'openrouter',
          client: { complete: openrouter },
          model: 'anthropic/claude-haiku-4.5',
        },
      ],
    });
    const rateLimiter = new RateLimiter({
      repo: new MemoryRateLimitRepository(createMemoryStore()),
      now,
    });
    return new ParseEventTextService({ parser, rateLimiter, now });
  };
  const call = (service: ParseEventTextService) =>
    service.execute({ userId: 'u1', text: 'Dinner', timezone: 'UTC' });

  it('REQ-96: a request answered after failover counts once', async () => {
    const anthropic = vi.fn().mockRejectedValue(new ProviderUnavailableError('server'));
    const openrouter = vi.fn().mockResolvedValue(RAW);
    const service = setup(anthropic, openrouter);

    for (let i = 1; i <= 20; i++) {
      await call(service);
    }
    await expect(call(service)).rejects.toBeInstanceOf(AiLimitReachedError);
    expect(anthropic).toHaveBeenCalledTimes(20);
    expect(openrouter).toHaveBeenCalledTimes(20);
  });

  it('REQ-96: a request where every provider fails counts once', async () => {
    const anthropic = vi.fn().mockRejectedValue(new ProviderUnavailableError('server'));
    const openrouter = vi.fn().mockRejectedValue(new ProviderUnavailableError('server'));
    const service = setup(anthropic, openrouter);

    for (let i = 1; i <= 20; i++) {
      await expect(call(service)).rejects.toBeInstanceOf(AiUnavailableError);
    }
    await expect(call(service)).rejects.toBeInstanceOf(AiLimitReachedError);
  });
});

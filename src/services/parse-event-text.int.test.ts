import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createEventRow, createUser, resetDatabase } from '@/test/db';
import { PrismaRateLimitRepository } from '@/repositories/prisma/prisma-rate-limit-repository';
import type { EventRepository } from '@/repositories/interfaces';
import type { ParseEventResult } from '@/lib/ai/types';
import { RateLimiter } from './rate-limiter';
import { ParseEventTextService } from './parse-event-text';
import { AiEventParser } from './ai-event-parser';

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

describe('ParseEventTextService (REQ-50)', () => {
  beforeEach(resetDatabase);

  it('REQ-50: parsing text leaves the events table unchanged', async () => {
    const owner = await createUser();
    await createEventRow(owner.id);
    const parser = { parse: vi.fn().mockResolvedValue(result) };
    const rateLimiter = new RateLimiter({
      repo: new PrismaRateLimitRepository(prisma),
      now: () => new Date(),
    });
    const service = new ParseEventTextService({ parser, rateLimiter, now: () => new Date() });

    const before = await prisma.event.count();
    expect(before).toBe(1);

    await service.execute({ userId: owner.id, text: 'Dinner', timezone: 'UTC' });

    expect(await prisma.event.count()).toBe(before);
  });
});

new ParseEventTextService({
  // @ts-expect-error ParseEventTextService takes no EventRepository
  events: {} as EventRepository,
  parser: { parse: vi.fn() },
  rateLimiter: new RateLimiter({
    repo: new PrismaRateLimitRepository(prisma),
    now: () => new Date(),
  }),
  now: () => new Date(),
});
// @ts-expect-error AiEventParser takes no EventRepository
new AiEventParser({ events: {} as EventRepository, client: { complete: vi.fn() }, model: 'm' });

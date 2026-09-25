import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { resetDatabase } from '@/test/db';
import { PrismaRateLimitRepository } from './prisma-rate-limit-repository';

describe('PrismaRateLimitRepository', () => {
  beforeEach(resetDatabase);

  it('REQ-55: 15 concurrent increments return 1 to 15 exactly once', async () => {
    const repo = new PrismaRateLimitRepository(prisma);
    const ws = new Date('2026-09-24T15:00:00.000Z');

    const counts = await Promise.all(
      Array.from({ length: 15 }, () => repo.increment('rsvp:h1', ws)),
    );

    expect([...counts].sort((a, b) => a - b)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));

    const otherWindow = await repo.increment('rsvp:h1', new Date(ws.getTime() + 600_000));
    expect(otherWindow).toBe(1);
  });

  it('REQ-119: count reads the current counter and never creates a row', async () => {
    const repo = new PrismaRateLimitRepository(prisma);
    const ws = new Date('2026-09-25T12:00:00.000Z');
    expect(await repo.count('signin-ip:h1', ws)).toBe(0);
    expect(await prisma.rateLimit.count()).toBe(0);
    await repo.increment('signin-ip:h1', ws);
    await repo.increment('signin-ip:h1', ws);
    expect(await repo.count('signin-ip:h1', ws)).toBe(2);
  });
});

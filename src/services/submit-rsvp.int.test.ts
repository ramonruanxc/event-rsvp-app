import { beforeEach, describe, expect, it } from 'vitest';
import { RateLimitedError } from '@/domain/errors';
import { hashIp } from '@/lib/client-ip';
import { prisma } from '@/lib/prisma';
import { PrismaEventRepository } from '@/repositories/prisma/prisma-event-repository';
import { PrismaRsvpRepository } from '@/repositories/prisma/prisma-rsvp-repository';
import { PrismaRateLimitRepository } from '@/repositories/prisma/prisma-rate-limit-repository';
import { createEventRow, createUser, resetDatabase } from '@/test/db';
import { RateLimiter } from './rate-limiter';
import { SubmitRsvpService } from './submit-rsvp';

describe('SubmitRsvpService (REQ-56)', () => {
  beforeEach(resetDatabase);

  it('REQ-56: rate-limit rows hold only the hashed IP', async () => {
    const owner = await createUser();
    const event = await createEventRow(owner.id);
    const ipHash = hashIp('203.0.113.7', 'salt');
    const service = new SubmitRsvpService({
      events: new PrismaEventRepository(prisma),
      rsvps: new PrismaRsvpRepository(prisma),
      now: () => new Date(),
      rateLimiter: new RateLimiter({
        repo: new PrismaRateLimitRepository(prisma),
        now: () => new Date(),
      }),
    });

    for (let i = 1; i <= 10; i++) {
      await service.execute({
        slug: event.slug,
        editToken: null,
        ipHash,
        honeypot: '',
        values: { name: `Guest ${i}`, status: 'GOING', partySize: 1 },
      });
    }

    await expect(
      service.execute({
        slug: event.slug,
        editToken: null,
        ipHash,
        honeypot: '',
        values: { name: 'Guest 11', status: 'GOING', partySize: 1 },
      }),
    ).rejects.toBeInstanceOf(RateLimitedError);

    const rows = await prisma.rateLimit.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe(`rsvp:${ipHash}`);
    expect(rows[0].key).toMatch(/^rsvp:[0-9a-f]{64}$/);
    expect(rows[0].count).toBe(11);
    expect(rows.every((row) => !row.key.includes('203.0.113.7'))).toBe(true);
  });
});

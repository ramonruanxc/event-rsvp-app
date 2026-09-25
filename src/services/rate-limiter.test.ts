import { describe, expect, it } from 'vitest';
import { createMemoryRepositories } from '@/repositories/memory';
import { AI_RULE, RateLimiter, RSVP_RULE, windowStart } from './rate-limiter';

describe('windowStart', () => {
  it('REQ-55: windowStart aligns to the window size', () => {
    expect(windowStart(new Date('2026-09-24T15:07:30.000Z'), 600_000)).toEqual(
      new Date('2026-09-24T15:00:00.000Z'),
    );
    expect(windowStart(new Date('2026-09-24T23:59:59.000Z'), 86_400_000)).toEqual(
      new Date('2026-09-24T00:00:00.000Z'),
    );
  });
});

describe('RateLimiter', () => {
  it('REQ-55: allows 10 RSVP submissions per window and refuses the 11th', async () => {
    const { rateLimits } = createMemoryRepositories();
    const now = () => new Date('2026-09-24T15:00:00.000Z');
    const limiter = new RateLimiter({ repo: rateLimits, now });

    for (let i = 1; i <= 10; i++) {
      const result = await limiter.consume(RSVP_RULE, 'h1');
      expect(result.allowed).toBe(true);
    }
    const eleventh = await limiter.consume(RSVP_RULE, 'h1');
    expect(eleventh).toEqual({ allowed: false, count: 11 });
  });

  it('REQ-55: a new window starts from zero', async () => {
    const { rateLimits } = createMemoryRepositories();
    let current = new Date('2026-09-24T15:00:00.000Z');
    const limiter = new RateLimiter({ repo: rateLimits, now: () => current });

    await limiter.consume(RSVP_RULE, 'h1');
    current = new Date(current.getTime() + 600_000);
    const result = await limiter.consume(RSVP_RULE, 'h1');

    expect(result).toEqual({ allowed: true, count: 1 });
  });

  it('REQ-55: counters are per rule and subject', async () => {
    const { rateLimits } = createMemoryRepositories();
    const now = () => new Date('2026-09-24T15:00:00.000Z');
    const limiter = new RateLimiter({ repo: rateLimits, now });

    await limiter.consume(AI_RULE, 'u1');
    const rsvpU1 = await limiter.consume(RSVP_RULE, 'u1');
    const aiU2 = await limiter.consume(AI_RULE, 'u2');

    expect(rsvpU1).toEqual({ allowed: true, count: 1 });
    expect(aiU2).toEqual({ allowed: true, count: 1 });
  });
});

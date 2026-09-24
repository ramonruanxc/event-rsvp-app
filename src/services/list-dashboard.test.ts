import { describe, expect, it } from 'vitest';
import { createMemoryRepositories } from '@/repositories/memory';
import { ListDashboardService } from './list-dashboard';

const now = () => new Date('2026-09-24T15:00:00.000Z');

describe('ListDashboardService', () => {
  it("REQ-35: splits the owner's events into upcoming (soonest first) and past (latest first) with totals", async () => {
    const { events, rsvps } = createMemoryRepositories();
    const eventA = await events.create({
      slug: 'event-a',
      ownerId: 'u1',
      name: 'Event A',
      description: 'Desc A',
      location: null,
      startsAt: new Date('2026-10-01T12:00:00.000Z'),
      timezone: 'UTC',
    });
    const eventB = await events.create({
      slug: 'event-b',
      ownerId: 'u1',
      name: 'Event B',
      description: 'Desc B',
      location: null,
      startsAt: new Date('2026-09-30T12:00:00.000Z'),
      timezone: 'UTC',
    });
    const eventC = await events.create({
      slug: 'event-c',
      ownerId: 'u1',
      name: 'Event C',
      description: 'Desc C',
      location: null,
      startsAt: new Date('2026-09-20T12:00:00.000Z'),
      timezone: 'UTC',
    });
    await events.create({
      slug: 'event-d',
      ownerId: 'u2',
      name: 'Event D',
      description: 'Desc D',
      location: null,
      startsAt: new Date('2026-10-05T12:00:00.000Z'),
      timezone: 'UTC',
    });
    await rsvps.create({
      eventId: eventA.id,
      name: 'Maria',
      nameKey: 'maria',
      status: 'GOING',
      partySize: 2,
      editTokenHash: '0'.repeat(64),
    });
    await rsvps.create({
      eventId: eventA.id,
      name: 'Joao',
      nameKey: 'joao',
      status: 'NOT_GOING',
      partySize: 0,
      editTokenHash: '1'.repeat(64),
    });

    const service = new ListDashboardService({ events, now });
    const result = await service.execute({ ownerId: 'u1' });

    expect(result.upcoming.map((item) => item.slug)).toEqual([eventB.slug, eventA.slug]);
    expect(result.past.map((item) => item.slug)).toEqual([eventC.slug]);
    const itemA = result.upcoming.find((item) => item.slug === eventA.slug);
    expect(itemA?.totals).toEqual({ going: 1, declined: 1, people: 2 });
    expect(itemA?.name).toBe('Event A');
    expect(itemA?.timezone).toBe('UTC');
    expect(itemA?.startsAt).toEqual(eventA.startsAt);
  });
});

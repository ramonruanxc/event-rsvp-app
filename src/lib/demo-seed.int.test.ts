import { beforeEach, describe, expect, it } from 'vitest';
import { SAMPLE_GUESTS } from '@/domain/sample';
import { prisma } from '@/lib/prisma';
import { resetDatabase } from '@/test/db';
import { DEMO_EMAIL, DEMO_SLUG, seedDemo } from './demo-seed';

const now = new Date('2026-09-24T15:00:00.000Z');

describe('seedDemo', () => {
  beforeEach(resetDatabase);

  it('REQ-40: seeds the public demo event with 5 guests', async () => {
    await seedDemo(prisma, now);

    const event = await prisma.event.findUnique({
      where: { slug: DEMO_SLUG },
      include: { owner: true, rsvps: true },
    });

    expect(event).not.toBeNull();
    expect(event?.name).toBe('Community Picnic in the Park');
    expect(event?.timezone).toBe('America/New_York');
    expect(event?.location).toBe('Riverside Park');
    expect(event?.startsAt.toISOString()).toBe('2026-10-24T22:00:00.000Z');
    expect(event?.rsvps).toHaveLength(5);
    expect(event?.owner.email).toBe(DEMO_EMAIL);
  });

  it('REQ-40: running the seed twice changes nothing', async () => {
    await seedDemo(prisma, now);
    await seedDemo(prisma, now);

    expect(await prisma.event.count()).toBe(1);
    expect(await prisma.rsvp.count()).toBe(5);
    expect(await prisma.user.count({ where: { email: DEMO_EMAIL } })).toBe(1);
  });

  it('REQ-40: a demo event starting within 7 days is moved forward', async () => {
    await seedDemo(prisma, now);
    const event = await prisma.event.findUniqueOrThrow({ where: { slug: DEMO_SLUG } });
    await prisma.event.update({
      where: { id: event.id },
      data: { startsAt: new Date('2026-09-26T00:00:00Z') },
    });
    await prisma.rsvp.create({
      data: {
        eventId: event.id,
        name: 'Extra Guest',
        nameKey: 'extra guest',
        status: 'GOING',
        partySize: 1,
        editTokenHash: '0'.repeat(64),
      },
    });

    await seedDemo(prisma, now);

    const refreshed = await prisma.event.findUnique({
      where: { slug: DEMO_SLUG },
      include: { rsvps: true },
    });
    expect(refreshed?.startsAt.toISOString()).toBe('2026-10-24T22:00:00.000Z');
    expect(refreshed?.rsvps).toHaveLength(6);
  });

  it('REQ-110: repeated container starts converge to one demo event with its 5 guests', async () => {
    const nextDay = new Date('2026-09-25T15:00:00.000Z');
    for (const start of [now, now, nextDay]) await seedDemo(prisma, start);

    const events = await prisma.event.findMany({ include: { rsvps: true } });
    expect(events).toHaveLength(1);
    expect(events[0].slug).toBe(DEMO_SLUG);
    expect(events[0].startsAt.toISOString()).toBe('2026-10-24T22:00:00.000Z');
    expect(events[0].rsvps.map((r) => r.name).sort()).toEqual(
      SAMPLE_GUESTS.map((g) => g.name).sort(),
    );
    expect(await prisma.user.count()).toBe(1);
  });
});

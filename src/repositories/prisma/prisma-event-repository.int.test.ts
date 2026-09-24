import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createEventRow, createUser, resetDatabase } from '@/test/db';
import { PrismaEventRepository } from './prisma-event-repository';

describe('PrismaEventRepository', () => {
  beforeEach(resetDatabase);

  it('REQ-14: create stores the event and findBySlug returns it', async () => {
    const repo = new PrismaEventRepository(prisma);
    const owner = await createUser();

    const created = await repo.create({
      slug: 'abcdefghij',
      ownerId: owner.id,
      name: 'Team dinner',
      description: 'Pasta night',
      location: "Mario's",
      startsAt: new Date('2026-10-02T23:00:00.000Z'),
      timezone: 'America/New_York',
    });

    const found = await repo.findBySlug(created.slug);

    expect(found).not.toBeNull();
    expect(found?.slug).toBe('abcdefghij');
    expect(found?.ownerId).toBe(owner.id);
    expect(found?.name).toBe('Team dinner');
    expect(found?.description).toBe('Pasta night');
    expect(found?.location).toBe("Mario's");
    expect(found?.timezone).toBe('America/New_York');
    expect(found?.startsAt.toISOString()).toBe('2026-10-02T23:00:00.000Z');
  });

  it('REQ-14: findBySlug returns null for an unknown slug', async () => {
    const repo = new PrismaEventRepository(prisma);

    const found = await repo.findBySlug('unknown-slug-1');

    expect(found).toBeNull();
  });

  it('REQ-18: update changes the editable fields', async () => {
    const repo = new PrismaEventRepository(prisma);
    const owner = await createUser();
    const event = await createEventRow(owner.id);

    await repo.update(event.id, {
      name: 'Team lunch',
      description: 'Updated description',
      location: 'New spot',
      startsAt: new Date('2026-10-03T10:00:00.000Z'),
      timezone: 'Europe/Paris',
    });

    const found = await repo.findBySlug(event.slug);
    expect(found?.name).toBe('Team lunch');
    expect(found?.description).toBe('Updated description');
    expect(found?.location).toBe('New spot');
    expect(found?.startsAt.toISOString()).toBe('2026-10-03T10:00:00.000Z');
    expect(found?.timezone).toBe('Europe/Paris');
  });

  it('REQ-18: deleting an event removes its RSVPs', async () => {
    const repo = new PrismaEventRepository(prisma);
    const owner = await createUser();
    const event = await createEventRow(owner.id);

    for (const name of ['a', 'b', 'c']) {
      await prisma.rsvp.create({
        data: {
          eventId: event.id,
          name,
          nameKey: name,
          status: 'GOING',
          partySize: 1,
          editTokenHash: '0'.repeat(64),
        },
      });
    }

    await repo.delete(event.id);

    expect(await prisma.rsvp.count({ where: { eventId: event.id } })).toBe(0);
    expect(await repo.findBySlug(event.slug)).toBeNull();
  });

  it("REQ-35: lists only the owner's events with their RSVP status and party size", async () => {
    const repo = new PrismaEventRepository(prisma);
    const u1 = await createUser('u1@example.com');
    const u2 = await createUser('u2@example.com');
    const eventWithRsvps = await createEventRow(u1.id, { slug: 'eventwithrs' });
    await createEventRow(u1.id, { slug: 'eventnorsvp' });
    await createEventRow(u2.id, { slug: 'othersevent' });

    await prisma.rsvp.create({
      data: {
        eventId: eventWithRsvps.id,
        name: 'Maria',
        nameKey: 'maria',
        status: 'GOING',
        partySize: 2,
        editTokenHash: '0'.repeat(64),
      },
    });
    await prisma.rsvp.create({
      data: {
        eventId: eventWithRsvps.id,
        name: 'Joao',
        nameKey: 'joao',
        status: 'NOT_GOING',
        partySize: 0,
        editTokenHash: '1'.repeat(64),
      },
    });

    const result = await repo.listByOwnerWithRsvpSummaries(u1.id);
    const byStatus = (a: { status: string }, b: { status: string }) =>
      a.status.localeCompare(b.status);

    expect(result).toHaveLength(2);
    expect(result.every((row) => row.event.ownerId === u1.id)).toBe(true);
    const withRsvps = result.find((row) => row.event.id === eventWithRsvps.id);
    expect([...(withRsvps?.rsvps ?? [])].sort(byStatus)).toEqual(
      [
        { status: 'GOING', partySize: 2 },
        { status: 'NOT_GOING', partySize: 0 },
      ].sort(byStatus),
    );
  });
});

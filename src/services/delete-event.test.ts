import { describe, expect, it } from 'vitest';
import { NotFoundError, NotOwnerError } from '@/domain/errors';
import { createMemoryRepositories } from '@/repositories/memory';
import { DeleteEventService } from './delete-event';

async function arrange(startsAt = new Date('2026-10-02T23:00:00.000Z')) {
  const { events, rsvps, store } = createMemoryRepositories();
  const event = await events.create({
    slug: 'abc',
    ownerId: 'u1',
    name: 'Team dinner',
    description: 'Pasta night',
    location: null,
    startsAt,
    timezone: 'America/New_York',
  });
  for (const name of ['Maria', 'Joao']) {
    await rsvps.create({
      eventId: event.id,
      name,
      nameKey: name.toLowerCase(),
      status: 'GOING',
      partySize: 1,
      editTokenHash: '0'.repeat(64),
    });
  }
  return { events, store, event };
}

describe('DeleteEventService', () => {
  it('REQ-18: the owner deletes the event and its RSVPs', async () => {
    const { events, store } = await arrange();
    const service = new DeleteEventService({ events });

    await service.execute({ userId: 'u1', slug: 'abc' });

    expect(store.events).toHaveLength(0);
    expect(store.rsvps).toHaveLength(0);
  });

  it('REQ-18: another user gets NotOwnerError and nothing is deleted', async () => {
    const { events, store } = await arrange();
    const service = new DeleteEventService({ events });

    await expect(service.execute({ userId: 'u2', slug: 'abc' })).rejects.toBeInstanceOf(
      NotOwnerError,
    );
    expect(store.events).toHaveLength(1);
    expect(store.rsvps).toHaveLength(2);
  });

  it('REQ-18: unknown slug gets NotFoundError', async () => {
    const { events } = await arrange();
    const service = new DeleteEventService({ events });

    await expect(service.execute({ userId: 'u1', slug: 'nope' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('REQ-18: an ended event can still be deleted', async () => {
    const { events, store } = await arrange(new Date('2020-01-01T00:00:00.000Z'));
    const service = new DeleteEventService({ events });

    await service.execute({ userId: 'u1', slug: 'abc' });

    expect(store.events).toHaveLength(0);
  });
});

import { describe, expect, it } from 'vitest';
import { EventEndedError, NotFoundError, NotOwnerError, ValidationError } from '@/domain/errors';
import { createMemoryRepositories } from '@/repositories/memory';
import { UpdateEventService } from './update-event';

const validValues = {
  name: 'Team lunch',
  description: 'Pasta night',
  date: '2026-10-03',
  time: '12:00',
  timezone: 'Europe/Paris',
  location: '',
};

async function arrange() {
  const { events, rsvps, store } = createMemoryRepositories();
  const event = await events.create({
    slug: 'abc',
    ownerId: 'u1',
    name: 'Team dinner',
    description: 'Pasta night',
    location: null,
    startsAt: new Date('2026-10-02T23:00:00.000Z'),
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

describe('UpdateEventService', () => {
  it('REQ-16: the owner edits every field and existing RSVPs stay', async () => {
    const { events, store } = await arrange();
    const now = () => new Date('2026-09-24T15:00:00.000Z');
    const service = new UpdateEventService({ events, now });

    const updated = await service.execute({ userId: 'u1', slug: 'abc', values: validValues });

    expect(updated.name).toBe('Team lunch');
    expect(updated.description).toBe('Pasta night');
    expect(updated.startsAt.toISOString()).toBe('2026-10-03T10:00:00.000Z');
    expect(updated.timezone).toBe('Europe/Paris');
    expect(updated.location).toBeNull();
    expect(store.rsvps).toHaveLength(2);
  });

  it('REQ-16: another user or a signed-out user gets NotOwnerError', async () => {
    const { events } = await arrange();
    const now = () => new Date('2026-09-24T15:00:00.000Z');
    const service = new UpdateEventService({ events, now });

    await expect(
      service.execute({ userId: 'u2', slug: 'abc', values: validValues }),
    ).rejects.toBeInstanceOf(NotOwnerError);
    await expect(
      service.execute({ userId: null, slug: 'abc', values: validValues }),
    ).rejects.toBeInstanceOf(NotOwnerError);
  });

  it('REQ-16: unknown slug gets NotFoundError', async () => {
    const { events } = await arrange();
    const now = () => new Date('2026-09-24T15:00:00.000Z');
    const service = new UpdateEventService({ events, now });

    await expect(
      service.execute({ userId: 'u1', slug: 'nope', values: validValues }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('REQ-16: a new start in the past is rejected', async () => {
    const { events } = await arrange();
    const now = () => new Date('2026-09-24T15:00:00.000Z');
    const service = new UpdateEventService({ events, now });

    await expect(
      service.execute({
        userId: 'u1',
        slug: 'abc',
        values: { ...validValues, date: '2026-09-24', time: '08:00', timezone: 'UTC' },
      }),
    ).rejects.toMatchObject(new ValidationError({ date: 'inPast' }));
  });

  it('REQ-16: nothing can be edited after the event started', async () => {
    const { events } = await arrange();
    const now = () => new Date('2026-10-03T00:00:00.000Z');
    const service = new UpdateEventService({ events, now });

    await expect(
      service.execute({ userId: 'u1', slug: 'abc', values: validValues }),
    ).rejects.toBeInstanceOf(EventEndedError);
  });
});

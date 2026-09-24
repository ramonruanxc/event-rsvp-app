import { describe, expect, it } from 'vitest';
import { ValidationError } from '@/domain/errors';
import { computeTotals } from '@/domain/rsvp';
import { createMemoryRepositories } from '@/repositories/memory';
import { CreateSampleEventService } from './create-sample-event';

const content = {
  name: 'Sample: Friday get-together',
  description: 'A sample event to explore the app.',
  location: 'Community Hall',
};

const expectedGuests = [
  { name: 'Alex Martin', status: 'GOING', partySize: 2 },
  { name: 'Priya Shah', status: 'GOING', partySize: 1 },
  { name: 'Lucas Oliveira', status: 'GOING', partySize: 3 },
  { name: 'Chloé Dubois', status: 'NOT_GOING', partySize: 0 },
  { name: 'Sam Lee', status: 'GOING', partySize: 1 },
];

describe('CreateSampleEventService', () => {
  it('REQ-37: the sample event is 7 days ahead at 19:00 in the organizer timezone with 5 RSVPs', async () => {
    const now = () => new Date('2026-09-24T15:00:00.000Z');
    const { events, rsvps, store } = createMemoryRepositories();
    const service = new CreateSampleEventService({ events, rsvps, now });

    const event = await service.execute({ ownerId: 'u1', timezone: 'America/Fortaleza', content });

    expect(event.startsAt.toISOString()).toBe('2026-10-01T22:00:00.000Z');
    expect(event.timezone).toBe('America/Fortaleza');
    expect(event.name).toBe(content.name);
    expect(event.description).toBe(content.description);
    expect(event.location).toBe(content.location);
    expect(event.ownerId).toBe('u1');

    const stored = store.rsvps.filter((rsvp) => rsvp.eventId === event.id);
    expect(stored).toHaveLength(5);
    expect(
      stored.map(({ name, status, partySize }) => ({ name, status, partySize })),
    ).toEqual(expectedGuests);

    expect(computeTotals(stored)).toEqual({ going: 4, declined: 1, people: 7 });
  });

  it("REQ-37: the organizer's local date is used, not the UTC date", async () => {
    const now = () => new Date('2026-09-25T02:30:00.000Z');
    const { events, rsvps } = createMemoryRepositories();
    const service = new CreateSampleEventService({ events, rsvps, now });

    const event = await service.execute({ ownerId: 'u1', timezone: 'America/Fortaleza', content });

    expect(event.startsAt.toISOString()).toBe('2026-10-01T22:00:00.000Z');
  });

  it('REQ-37: an invalid timezone is rejected', async () => {
    const now = () => new Date('2026-09-24T15:00:00.000Z');
    const { events, rsvps, store } = createMemoryRepositories();
    const service = new CreateSampleEventService({ events, rsvps, now });

    await expect(
      service.execute({ ownerId: 'u1', timezone: 'Mars/Olympus', content }),
    ).rejects.toMatchObject(new ValidationError({ timezone: 'invalidTimezone' }));
    expect(store.events).toHaveLength(0);
  });
});

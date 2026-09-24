import { describe, expect, it } from 'vitest';
import { NotFoundError, NotOwnerError } from '@/domain/errors';
import { createMemoryRepositories } from '@/repositories/memory';
import { RemoveRsvpService } from './remove-rsvp';

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
  const otherEvent = await events.create({
    slug: 'xyz',
    ownerId: 'u1',
    name: 'Other event',
    description: 'Something else',
    location: null,
    startsAt: new Date('2026-11-02T23:00:00.000Z'),
    timezone: 'America/New_York',
  });
  const rsvp = await rsvps.create({
    eventId: event.id,
    name: 'Maria',
    nameKey: 'maria',
    status: 'GOING',
    partySize: 1,
    editTokenHash: '0'.repeat(64),
  });
  const otherRsvp = await rsvps.create({
    eventId: otherEvent.id,
    name: 'Joao',
    nameKey: 'joao',
    status: 'GOING',
    partySize: 1,
    editTokenHash: '1'.repeat(64),
  });
  return { events, rsvps, store, event, rsvp, otherRsvp };
}

describe('RemoveRsvpService', () => {
  it('REQ-30: the owner removes an RSVP', async () => {
    const { events, rsvps, store, event, rsvp } = await arrange();
    const service = new RemoveRsvpService({ events, rsvps });

    await service.execute({ userId: 'u1', slug: 'abc', rsvpId: rsvp.id });

    expect(store.rsvps.find((r) => r.id === rsvp.id)).toBeUndefined();
    expect(event.id).toBeDefined();
  });

  it('REQ-30: removal still works after the event ended', async () => {
    const { events, rsvps, store, rsvp } = await arrange(new Date('2020-01-01T00:00:00.000Z'));
    const service = new RemoveRsvpService({ events, rsvps });

    await service.execute({ userId: 'u1', slug: 'abc', rsvpId: rsvp.id });

    expect(store.rsvps.find((r) => r.id === rsvp.id)).toBeUndefined();
  });

  it('REQ-30: another user gets NotOwnerError and nothing is removed', async () => {
    const { events, rsvps, store, rsvp } = await arrange();
    const service = new RemoveRsvpService({ events, rsvps });

    await expect(
      service.execute({ userId: 'u2', slug: 'abc', rsvpId: rsvp.id }),
    ).rejects.toBeInstanceOf(NotOwnerError);
    expect(store.rsvps.find((r) => r.id === rsvp.id)).toBeDefined();
  });

  it('REQ-30: an RSVP of another event gets NotFoundError', async () => {
    const { events, rsvps, store, otherRsvp } = await arrange();
    const service = new RemoveRsvpService({ events, rsvps });

    await expect(
      service.execute({ userId: 'u1', slug: 'abc', rsvpId: otherRsvp.id }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(store.rsvps.find((r) => r.id === otherRsvp.id)).toBeDefined();
  });

  it('REQ-30: unknown slug gets NotFoundError', async () => {
    const { events, rsvps, rsvp } = await arrange();
    const service = new RemoveRsvpService({ events, rsvps });

    await expect(
      service.execute({ userId: 'u1', slug: 'nope', rsvpId: rsvp.id }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

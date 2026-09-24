import { describe, expect, it } from 'vitest';
import { EventEndedError, NotFoundError } from '@/domain/errors';
import { createMemoryRepositories } from '@/repositories/memory';
import { CancelRsvpService } from './cancel-rsvp';
import { SubmitRsvpService } from './submit-rsvp';

const now = () => new Date('2026-09-24T15:00:00.000Z');

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
  const submit = new SubmitRsvpService({ events, rsvps, now, newToken: () => 'T' });
  await submit.execute({
    slug: 'abc',
    editToken: null,
    ipHash: 'h1',
    honeypot: '',
    values: { name: 'Maria', status: 'GOING', partySize: 3 },
  });
  return { events, rsvps, store, event };
}

describe('CancelRsvpService', () => {
  it('REQ-28: cancel sets Not going with party size 0 and keeps the RSVP', async () => {
    const { events, rsvps, store } = await arrange();
    const service = new CancelRsvpService({ events, rsvps, now });

    const result = await service.execute({ slug: 'abc', editToken: 'T' });

    expect(result).toEqual({ name: 'Maria', status: 'NOT_GOING', partySize: 0 });
    expect(store.rsvps).toHaveLength(1);
    expect(store.rsvps[0].status).toBe('NOT_GOING');
    expect(store.rsvps[0].partySize).toBe(0);
  });

  it('REQ-28: cancel without a valid token gets NotFoundError', async () => {
    const { events, rsvps } = await arrange();
    const service = new CancelRsvpService({ events, rsvps, now });

    await expect(service.execute({ slug: 'abc', editToken: null })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(service.execute({ slug: 'abc', editToken: 'wrong' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('REQ-29: cancel after the start gets EventEndedError', async () => {
    const { events, rsvps } = await arrange();
    const service = new CancelRsvpService({
      events,
      rsvps,
      now: () => new Date('2026-10-02T23:00:01.000Z'),
    });

    await expect(service.execute({ slug: 'abc', editToken: 'T' })).rejects.toBeInstanceOf(
      EventEndedError,
    );
  });
});

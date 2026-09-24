import { describe, expect, it } from 'vitest';
import { NotFoundError, ValidationError } from '@/domain/errors';
import { hashToken } from '@/lib/crypto';
import { createMemoryRepositories } from '@/repositories/memory';
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
  return { events, rsvps, store, event };
}

const base = { slug: 'abc', editToken: null, ipHash: 'h1', honeypot: '' };

describe('SubmitRsvpService', () => {
  it('REQ-23: a guest without an account creates an RSVP and receives a token', async () => {
    const { events, rsvps, store } = await arrange();
    const service = new SubmitRsvpService({ events, rsvps, now });

    const result = await service.execute({
      ...base,
      values: { name: 'Maria', status: 'GOING', partySize: 3 },
    });

    expect(result.created).toBe(true);
    expect(result.editToken).toHaveLength(43);
    expect(result.cookieExpires).toEqual(new Date('2026-11-01T23:00:00.000Z'));
    expect(result.rsvp).toEqual({ name: 'Maria', status: 'GOING', partySize: 3 });

    expect(store.rsvps).toHaveLength(1);
    const stored = store.rsvps[0];
    expect(stored.name).toBe('Maria');
    expect(stored.nameKey).toBe('maria');
    expect(stored.status).toBe('GOING');
    expect(stored.partySize).toBe(3);
    expect(stored.editTokenHash).toBe(hashToken(result.editToken));
    expect(stored.editTokenHash).not.toBe(result.editToken);
  });

  it('REQ-23: invalid input is rejected with field errors', async () => {
    const { events, rsvps } = await arrange();
    const service = new SubmitRsvpService({ events, rsvps, now });

    await expect(
      service.execute({ ...base, values: { name: '', status: 'GOING', partySize: 1 } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('REQ-23: unknown event gets NotFoundError', async () => {
    const { events, rsvps } = await arrange();
    const service = new SubmitRsvpService({ events, rsvps, now });

    await expect(
      service.execute({
        ...base,
        slug: 'nope',
        values: { name: 'Maria', status: 'GOING', partySize: 3 },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('REQ-23: there is no capacity limit', async () => {
    const { events, rsvps, store, event } = await arrange();
    for (let i = 0; i < 200; i++) {
      store.rsvps.push({
        id: `g${i}`,
        eventId: event.id,
        name: `g${i}`,
        nameKey: `g${i}`,
        status: 'GOING',
        partySize: 1,
        editTokenHash: 'x'.repeat(64),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    const service = new SubmitRsvpService({ events, rsvps, now });

    const result = await service.execute({
      ...base,
      values: { name: 'Maria', status: 'GOING', partySize: 3 },
    });

    expect(result.created).toBe(true);
    expect(store.rsvps).toHaveLength(201);
  });
});

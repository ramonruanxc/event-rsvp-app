import { describe, expect, it } from 'vitest';
import { NotFoundError } from '@/domain/errors';
import { hashToken } from '@/lib/crypto';
import { createMemoryRepositories } from '@/repositories/memory';
import { GetEventPageService } from './get-event-page';

async function arrange(startsAt = new Date('2026-10-02T23:00:00.000Z')) {
  const { events, rsvps } = createMemoryRepositories();
  const event = await events.create({
    slug: 'abc',
    ownerId: 'u1',
    name: 'Team dinner',
    description: 'Pasta night',
    location: null,
    startsAt,
    timezone: 'America/New_York',
  });
  await rsvps.create({
    eventId: event.id,
    name: 'Maria',
    nameKey: 'maria',
    status: 'GOING',
    partySize: 3,
    editTokenHash: hashToken('T'),
  });
  await rsvps.create({
    eventId: event.id,
    name: 'João',
    nameKey: 'joao',
    status: 'NOT_GOING',
    partySize: 0,
    editTokenHash: '0'.repeat(64),
  });
  return { events, rsvps, event };
}

describe('GetEventPageService', () => {
  it('REQ-33: the owner gets every RSVP row and the totals', async () => {
    const { events, rsvps } = await arrange();
    const now = () => new Date('2026-09-24T15:00:00.000Z');
    const service = new GetEventPageService({ events, rsvps, now });

    const view = await service.execute({ slug: 'abc', userId: 'u1', editToken: null });

    expect(view.role).toBe('owner');
    if (view.role !== 'owner') throw new Error('unreachable');
    expect(view.totals).toEqual({ going: 1, declined: 1, people: 3 });
    expect(view.rsvps.map((r) => r.name)).toEqual(['Maria', 'João']);
    for (const row of view.rsvps) {
      expect(Object.keys(row).sort()).toEqual(
        ['id', 'name', 'status', 'partySize', 'updatedAt'].sort(),
      );
    }
  });

  it('REQ-33: the owner still gets the list after the event ended', async () => {
    const { events, rsvps } = await arrange();
    const now = () => new Date('2026-10-03T00:00:00.000Z');
    const service = new GetEventPageService({ events, rsvps, now });

    const view = await service.execute({ slug: 'abc', userId: 'u1', editToken: null });

    expect(view.role).toBe('owner');
    if (view.role !== 'owner') throw new Error('unreachable');
    expect(view.ended).toBe(true);
    expect(view.rsvps).toHaveLength(2);
  });

  it('REQ-33: a non-owner gets totals only, without any guest name', async () => {
    const { events, rsvps } = await arrange();
    const now = () => new Date('2026-09-24T15:00:00.000Z');
    const service = new GetEventPageService({ events, rsvps, now });

    for (const userId of ['u2', null]) {
      const view = await service.execute({ slug: 'abc', userId, editToken: null });
      expect(view.role).toBe('guest');
      if (view.role !== 'guest') throw new Error('unreachable');
      expect(view.ownRsvp).toBeNull();
      expect('rsvps' in view).toBe(false);
      expect(JSON.stringify(view)).not.toContain('Maria');
      expect(JSON.stringify(view)).not.toContain('João');
    }
  });

  it('REQ-33: unknown slug gets NotFoundError', async () => {
    const { events, rsvps } = await arrange();
    const now = () => new Date('2026-09-24T15:00:00.000Z');
    const service = new GetEventPageService({ events, rsvps, now });

    await expect(
      service.execute({ slug: 'nope', userId: 'u1', editToken: null }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('REQ-33: a guest with a valid edit token sees only their own RSVP', async () => {
    const { events, rsvps } = await arrange();
    const now = () => new Date('2026-09-24T15:00:00.000Z');
    const service = new GetEventPageService({ events, rsvps, now });

    const view = await service.execute({ slug: 'abc', userId: null, editToken: 'T' });

    expect(view.role).toBe('guest');
    if (view.role !== 'guest') throw new Error('unreachable');
    expect(view.ownRsvp).toEqual({ name: 'Maria', status: 'GOING', partySize: 3 });
    expect(JSON.stringify(view)).not.toContain('João');

    const wrongTokenView = await service.execute({
      slug: 'abc',
      userId: null,
      editToken: 'wrong',
    });
    expect(wrongTokenView.role).toBe('guest');
    if (wrongTokenView.role !== 'guest') throw new Error('unreachable');
    expect(wrongTokenView.ownRsvp).toBeNull();
  });
});

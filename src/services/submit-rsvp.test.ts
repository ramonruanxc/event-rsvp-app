import { describe, expect, it } from 'vitest';
import {
  DuplicateNameError,
  EventEndedError,
  NotFoundError,
  RateLimitedError,
  ValidationError,
} from '@/domain/errors';
import { hashToken } from '@/lib/crypto';
import { createMemoryRepositories, MemoryRateLimitRepository } from '@/repositories/memory';
import { RateLimiter } from './rate-limiter';
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

  async function arrangeMariaAndJoao() {
    const repos = await arrange();
    const tokens = ['T', 'U'];
    const service = new SubmitRsvpService({
      events: repos.events,
      rsvps: repos.rsvps,
      now,
      newToken: () => tokens.shift() ?? 'unused',
    });
    await service.execute({ ...base, values: { name: 'Maria', status: 'GOING', partySize: 3 } }); // token 'T'
    await service.execute({ ...base, values: { name: 'João', status: 'GOING', partySize: 1 } }); // token 'U'
    return { ...repos, service, before: structuredClone(repos.store.rsvps) };
  }

  it('REQ-26: a duplicate name without a token is blocked', async () => {
    const { service, store, before } = await arrangeMariaAndJoao();

    await expect(
      service.execute({
        ...base,
        editToken: null,
        values: { name: '  maria ', status: 'GOING', partySize: 2 },
      }),
    ).rejects.toBeInstanceOf(DuplicateNameError);

    expect(store.rsvps).toEqual(before);
  });

  it('REQ-26: a token that matches no RSVP does not count', async () => {
    const { service, store, before } = await arrangeMariaAndJoao();

    await expect(
      service.execute({
        ...base,
        editToken: 'not-a-real-token',
        values: { name: 'Maria', status: 'GOING', partySize: 2 },
      }),
    ).rejects.toBeInstanceOf(DuplicateNameError);

    expect(store.rsvps).toEqual(before);
  });

  it("REQ-26: another RSVP's token does not allow taking a name", async () => {
    const { service, store, before } = await arrangeMariaAndJoao();

    await expect(
      service.execute({
        ...base,
        editToken: 'U',
        values: { name: 'Maria', status: 'GOING', partySize: 2 },
      }),
    ).rejects.toBeInstanceOf(DuplicateNameError);

    expect(store.rsvps).toEqual(before);
  });
});

describe('SubmitRsvpService — REQ-25 same-browser resubmission', () => {
  it("REQ-25: the same name with the guest's own token edits the RSVP", async () => {
    const { events, rsvps, store } = await arrange();
    const service = new SubmitRsvpService({ events, rsvps, now, newToken: () => 'T' });
    await service.execute({ ...base, values: { name: 'Maria', status: 'GOING', partySize: 3 } });
    const originalId = store.rsvps[0].id;

    const result = await service.execute({
      ...base,
      editToken: 'T',
      values: { name: '  maria ', status: 'GOING', partySize: 5 },
    });

    expect(store.rsvps).toHaveLength(1);
    expect(store.rsvps[0].id).toBe(originalId);
    expect(store.rsvps[0].partySize).toBe(5);
    expect(store.rsvps[0].name).toBe('maria');
    expect(result.created).toBe(false);
    expect(result.editToken).toBe('T');
  });

  it('REQ-25: the guest can rename their own RSVP', async () => {
    const { events, rsvps, store } = await arrange();
    const service = new SubmitRsvpService({ events, rsvps, now, newToken: () => 'T' });
    await service.execute({ ...base, values: { name: 'Maria', status: 'GOING', partySize: 3 } });
    const originalId = store.rsvps[0].id;

    await service.execute({
      ...base,
      editToken: 'T',
      values: { name: 'Maria Silva', status: 'GOING', partySize: 3 },
    });

    expect(store.rsvps).toHaveLength(1);
    expect(store.rsvps[0].id).toBe(originalId);
    expect(store.rsvps[0].name).toBe('Maria Silva');
  });
});

describe('SubmitRsvpService — REQ-29 submission closes at the start time', () => {
  it('REQ-29: submissions after the start are rejected', async () => {
    const { events, rsvps, store } = await arrange();
    const beforeService = new SubmitRsvpService({ events, rsvps, now, newToken: () => 'T' });
    await beforeService.execute({
      ...base,
      values: { name: 'Maria', status: 'GOING', partySize: 3 },
    });

    const afterService = new SubmitRsvpService({
      events,
      rsvps,
      now: () => new Date('2026-10-02T23:00:01.000Z'),
    });

    await expect(
      afterService.execute({
        ...base,
        editToken: null,
        values: { name: 'João', status: 'GOING', partySize: 1 },
      }),
    ).rejects.toBeInstanceOf(EventEndedError);

    await expect(
      afterService.execute({
        ...base,
        editToken: 'T',
        values: { name: 'Maria', status: 'GOING', partySize: 5 },
      }),
    ).rejects.toBeInstanceOf(EventEndedError);

    expect(store.rsvps).toHaveLength(1);
    expect(store.rsvps[0].partySize).toBe(3);
  });

  it('REQ-29: a submission exactly at the start is accepted, one second later it is rejected', async () => {
    const { events, rsvps, store } = await arrange();
    let current = new Date('2026-10-02T23:00:00.000Z');
    const clock = () => current;
    const service = new SubmitRsvpService({ events, rsvps, now: clock });

    const result = await service.execute({
      ...base,
      values: { name: 'Maria', status: 'GOING', partySize: 3 },
    });
    expect(result.created).toBe(true);

    current = new Date('2026-10-02T23:00:01.000Z');
    await expect(
      service.execute({
        ...base,
        values: { name: 'João', status: 'GOING', partySize: 1 },
      }),
    ).rejects.toBeInstanceOf(EventEndedError);

    expect(store.rsvps).toHaveLength(1);
  });
});

describe('SubmitRsvpService — REQ-56 rate limit', () => {
  it('REQ-56: the 11th submission from the same IP hash is refused and stores nothing; another IP hash is not affected', async () => {
    const { events, rsvps, store } = await arrange();
    const rateLimiter = new RateLimiter({ repo: new MemoryRateLimitRepository(store), now });
    const service = new SubmitRsvpService({ events, rsvps, now, rateLimiter });
    const going = (name: string) => ({ name, status: 'GOING', partySize: 1 });

    for (let i = 1; i <= 10; i++) {
      await service.execute({ ...base, values: going('Guest ' + i) });
    }

    await expect(
      service.execute({ ...base, values: going('Guest 11') }),
    ).rejects.toBeInstanceOf(RateLimitedError);
    expect(store.rsvps).toHaveLength(10);

    const result = await service.execute({
      ...base,
      ipHash: 'h2',
      values: going('Guest 11'),
    });
    expect(result.created).toBe(true);
    expect(store.rsvps).toHaveLength(11);
  });

  it('REQ-56: the limit is checked before validation', async () => {
    const { events, rsvps, store } = await arrange();
    const rateLimiter = new RateLimiter({ repo: new MemoryRateLimitRepository(store), now });
    const service = new SubmitRsvpService({ events, rsvps, now, rateLimiter });
    const going = (name: string) => ({ name, status: 'GOING', partySize: 1 });

    for (let i = 1; i <= 10; i++) {
      await expect(
        service.execute({ ...base, values: going('') }),
      ).rejects.toBeInstanceOf(ValidationError);
    }

    await expect(
      service.execute({ ...base, values: going('Ana') }),
    ).rejects.toBeInstanceOf(RateLimitedError);
  });
});

import { describe, expect, it } from 'vitest';
import { ValidationError } from '@/domain/errors';
import { createMemoryRepositories } from '@/repositories/memory';
import { CreateEventService } from './create-event';

const now = () => new Date('2026-09-24T15:00:00.000Z');
const newSlug = () => 'abcdefghij';

const validValues = {
  name: 'Team dinner',
  description: 'Pasta night',
  date: '2026-10-02',
  time: '19:00',
  timezone: 'America/New_York',
  location: "Mario's",
};

describe('CreateEventService', () => {
  it('REQ-14: stores a valid event with UTC start, timezone and owner', async () => {
    const { events, store } = createMemoryRepositories();
    const service = new CreateEventService({ events, now, newSlug });

    const record = await service.execute({ ownerId: 'u1', values: validValues });

    expect(record.slug).toBe('abcdefghij');
    expect(record.ownerId).toBe('u1');
    expect(record.startsAt.toISOString()).toBe('2026-10-02T23:00:00.000Z');
    expect(record.timezone).toBe('America/New_York');
    expect(record.location).toBe("Mario's");
    expect(Object.keys(record)).not.toContain('endsAt');
    expect(store.events).toHaveLength(1);
    expect(store.events[0].slug).toBe('abcdefghij');
  });

  it('REQ-14: rejects invalid input with field errors and stores nothing', async () => {
    const { events, store } = createMemoryRepositories();
    const service = new CreateEventService({ events, now, newSlug });

    await expect(
      service.execute({ ownerId: 'u1', values: { ...validValues, name: '' } }),
    ).rejects.toMatchObject(new ValidationError({ name: 'required' }));
    expect(store.events).toHaveLength(0);
  });

  it('REQ-14: accepts a start equal to now', async () => {
    const { events } = createMemoryRepositories();
    const service = new CreateEventService({ events, now, newSlug });

    const record = await service.execute({
      ownerId: 'u1',
      values: { ...validValues, date: '2026-09-24', time: '11:00', timezone: 'America/New_York' },
    });

    expect(record.startsAt.toISOString()).toBe('2026-09-24T15:00:00.000Z');
  });

  it('REQ-14: rejects a start before now', async () => {
    const { events } = createMemoryRepositories();
    const service = new CreateEventService({ events, now, newSlug });

    await expect(
      service.execute({
        ownerId: 'u1',
        values: { ...validValues, date: '2026-09-24', time: '10:59', timezone: 'America/New_York' },
      }),
    ).rejects.toMatchObject(new ValidationError({ date: 'inPast' }));
  });

  it('REQ-14: generates a slug when none is injected', async () => {
    const { events } = createMemoryRepositories();
    const service = new CreateEventService({ events, now });

    const record = await service.execute({ ownerId: 'u1', values: validValues });

    expect(record.slug).toMatch(/^[A-Za-z0-9_-]{10}$/);
  });
});

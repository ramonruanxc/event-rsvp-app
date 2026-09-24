import { describe, expect, it } from 'vitest';
import { NotFoundError } from '@/domain/errors';
import { createMemoryRepositories } from '@/repositories/memory';
import { ExportEventIcsService } from './export-event-ics';

const now = () => new Date('2026-09-24T15:00:00.000Z');

describe('ExportEventIcsService', () => {
  it('REQ-42: the service returns the file name and the calendar body', async () => {
    const { events } = createMemoryRepositories();
    const event = await events.create({
      slug: 'abc',
      ownerId: 'u1',
      name: 'Team dinner',
      description: 'Pasta night',
      location: null,
      startsAt: new Date('2026-10-02T23:00:00.000Z'),
      timezone: 'America/New_York',
    });
    const service = new ExportEventIcsService({ events, now });

    const result = await service.execute({ slug: event.slug });

    expect(result.filename).toBe('abc.ics');
    expect(result.body).toContain('SUMMARY:Team dinner');
  });

  it('REQ-42: unknown slug gets NotFoundError', async () => {
    const { events } = createMemoryRepositories();
    const service = new ExportEventIcsService({ events, now });

    await expect(service.execute({ slug: 'nope' })).rejects.toBeInstanceOf(NotFoundError);
  });
});

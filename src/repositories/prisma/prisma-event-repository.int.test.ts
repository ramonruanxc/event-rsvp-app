import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createUser, resetDatabase } from '@/test/db';
import { PrismaEventRepository } from './prisma-event-repository';

describe('PrismaEventRepository', () => {
  beforeEach(resetDatabase);

  it('REQ-14: create stores the event and findBySlug returns it', async () => {
    const repo = new PrismaEventRepository(prisma);
    const owner = await createUser();

    const created = await repo.create({
      slug: 'abcdefghij',
      ownerId: owner.id,
      name: 'Team dinner',
      description: 'Pasta night',
      location: "Mario's",
      startsAt: new Date('2026-10-02T23:00:00.000Z'),
      timezone: 'America/New_York',
    });

    const found = await repo.findBySlug(created.slug);

    expect(found).not.toBeNull();
    expect(found?.slug).toBe('abcdefghij');
    expect(found?.ownerId).toBe(owner.id);
    expect(found?.name).toBe('Team dinner');
    expect(found?.description).toBe('Pasta night');
    expect(found?.location).toBe("Mario's");
    expect(found?.timezone).toBe('America/New_York');
    expect(found?.startsAt.toISOString()).toBe('2026-10-02T23:00:00.000Z');
  });

  it('REQ-14: findBySlug returns null for an unknown slug', async () => {
    const repo = new PrismaEventRepository(prisma);

    const found = await repo.findBySlug('unknown-slug-1');

    expect(found).toBeNull();
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/prisma';
import { DuplicateNameError } from '@/domain/errors';
import { createEventRow, createUser, resetDatabase } from '@/test/db';
import { PrismaRsvpRepository } from './prisma-rsvp-repository';

describe('PrismaRsvpRepository', () => {
  beforeEach(resetDatabase);

  it('REQ-27: concurrent creates of the same name key let exactly one through', async () => {
    const repo = new PrismaRsvpRepository(prisma);
    const owner = await createUser();
    const event = await createEventRow(owner.id);

    const results = await Promise.allSettled([
      repo.create({
        eventId: event.id,
        name: 'Maria',
        nameKey: 'maria',
        status: 'GOING',
        partySize: 1,
        editTokenHash: '0'.repeat(64),
      }),
      repo.create({
        eventId: event.id,
        name: 'maria',
        nameKey: 'maria',
        status: 'GOING',
        partySize: 2,
        editTokenHash: '1'.repeat(64),
      }),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(DuplicateNameError);
  });

  it('REQ-27: renaming onto an existing name key is rejected', async () => {
    const repo = new PrismaRsvpRepository(prisma);
    const owner = await createUser();
    const event = await createEventRow(owner.id);

    await repo.create({
      eventId: event.id,
      name: 'Maria',
      nameKey: 'maria',
      status: 'GOING',
      partySize: 1,
      editTokenHash: '0'.repeat(64),
    });
    const joao = await repo.create({
      eventId: event.id,
      name: 'Joao',
      nameKey: 'joao',
      status: 'GOING',
      partySize: 1,
      editTokenHash: '1'.repeat(64),
    });

    await expect(repo.update(joao.id, { name: 'Maria', nameKey: 'maria' })).rejects.toBeInstanceOf(
      DuplicateNameError,
    );
  });
});

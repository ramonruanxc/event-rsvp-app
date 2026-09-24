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

  it("REQ-33: listByEvent returns the event's RSVPs oldest first", async () => {
    const repo = new PrismaRsvpRepository(prisma);
    const owner = await createUser();
    const event = await createEventRow(owner.id);
    const otherEvent = await createEventRow(owner.id, { slug: 'otherevent1' });

    await repo.create({
      eventId: event.id,
      name: 'b',
      nameKey: 'b',
      status: 'GOING',
      partySize: 1,
      editTokenHash: '2'.repeat(64),
    });
    await repo.create({
      eventId: event.id,
      name: 'a',
      nameKey: 'a',
      status: 'GOING',
      partySize: 1,
      editTokenHash: '3'.repeat(64),
    });
    await repo.create({
      eventId: otherEvent.id,
      name: 'c',
      nameKey: 'c',
      status: 'GOING',
      partySize: 1,
      editTokenHash: '4'.repeat(64),
    });

    const list = await repo.listByEvent(event.id);

    expect(list.map((rsvp) => rsvp.name)).toEqual(['b', 'a']);
  });

  it('REQ-33: finds an RSVP by id, by name key and by token hash', async () => {
    const repo = new PrismaRsvpRepository(prisma);
    const owner = await createUser();
    const event = await createEventRow(owner.id);
    const otherEvent = await createEventRow(owner.id, { slug: 'otherevent2' });

    const maria = await repo.create({
      eventId: event.id,
      name: 'Maria',
      nameKey: 'maria',
      status: 'GOING',
      partySize: 1,
      editTokenHash: '5'.repeat(64),
    });

    expect(await repo.findById(maria.id)).toMatchObject({ id: maria.id, name: 'Maria' });
    expect(await repo.findByNameKey(event.id, 'maria')).toMatchObject({ id: maria.id });
    expect(await repo.findByTokenHash(event.id, '5'.repeat(64))).toMatchObject({ id: maria.id });

    expect(await repo.findById('unknown-id')).toBeNull();
    expect(await repo.findByNameKey(event.id, 'unknown')).toBeNull();
    expect(await repo.findByTokenHash(event.id, '9'.repeat(64))).toBeNull();
    expect(await repo.findByNameKey(otherEvent.id, 'maria')).toBeNull();
    expect(await repo.findByTokenHash(otherEvent.id, '5'.repeat(64))).toBeNull();
  });

  it('REQ-30: delete removes one RSVP', async () => {
    const repo = new PrismaRsvpRepository(prisma);
    const owner = await createUser();
    const event = await createEventRow(owner.id);
    const maria = await repo.create({
      eventId: event.id,
      name: 'Maria',
      nameKey: 'maria',
      status: 'GOING',
      partySize: 1,
      editTokenHash: '6'.repeat(64),
    });

    await repo.delete(maria.id);

    expect(await repo.findById(maria.id)).toBeNull();
  });

  it('REQ-37: createMany stores all given RSVPs', async () => {
    const repo = new PrismaRsvpRepository(prisma);
    const owner = await createUser();
    const event = await createEventRow(owner.id);
    const names = ['a', 'b', 'c', 'd', 'e'];

    await repo.createMany(
      names.map((name, index) => ({
        eventId: event.id,
        name,
        nameKey: name,
        status: 'GOING' as const,
        partySize: 1,
        editTokenHash: `${index}`.repeat(64),
      })),
    );

    const list = await repo.listByEvent(event.id);
    expect(list).toHaveLength(5);
  });
});

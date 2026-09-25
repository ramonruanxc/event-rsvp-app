import { beforeEach, describe, expect, it } from 'vitest';
import { EmailTakenError } from '@/domain/errors';
import { prisma } from '@/lib/prisma';
import { resetDatabase } from '@/test/db';
import { PrismaUserRepository } from './prisma-user-repository';

describe('PrismaUserRepository', () => {
  beforeEach(resetDatabase);
  const repo = () => new PrismaUserRepository(prisma);

  it('REQ-116: creates a password user and finds it by email (any case) and id', async () => {
    const created = await repo().create({
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'scrypt$x',
    });
    expect(created).toEqual({
      id: created.id,
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'scrypt$x',
      passwordClearedAt: null,
      passwordNotice: false,
    });
    expect(await repo().findByEmail('ana@example.com')).toEqual(created);
    await prisma.user.create({ data: { email: 'Gil@Example.com', name: 'Gil' } });
    expect((await repo().findByEmail('gil@example.com'))?.name).toBe('Gil');
    expect(await repo().findById(created.id)).toEqual(created);
    expect(await repo().findByEmail('nobody@example.com')).toBeNull();
    expect(await repo().findById('missing')).toBeNull();
  });

  it('REQ-117: only one of two concurrent registrations of an email succeeds', async () => {
    const data = { name: 'Ana', email: 'ana@example.com', passwordHash: 'scrypt$x' };
    const results = await Promise.allSettled([repo().create(data), repo().create(data)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(EmailTakenError);
    expect(await prisma.user.count()).toBe(1);
  });

  it('REQ-122: clearPassword removes the hash, records when and raises the notice', async () => {
    const { id } = await repo().create({
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'scrypt$x',
    });
    const at = new Date('2026-09-25T12:00:00.000Z');
    await repo().clearPassword(id, at);
    expect(await repo().findById(id)).toMatchObject({
      passwordHash: null,
      passwordClearedAt: at,
      passwordNotice: true,
    });
  });

  it('REQ-123: setPassword and dismissPasswordNotice lower the notice', async () => {
    const { id } = await repo().create({
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: 'scrypt$x',
    });
    await repo().clearPassword(id, new Date('2026-09-25T12:00:00.000Z'));
    await repo().setPassword(id, 'scrypt$y');
    expect(await repo().findById(id)).toMatchObject({
      passwordHash: 'scrypt$y',
      passwordNotice: false,
    });
    await repo().clearPassword(id, new Date('2026-09-25T13:00:00.000Z'));
    await repo().dismissPasswordNotice(id);
    expect(await repo().findById(id)).toMatchObject({ passwordHash: null, passwordNotice: false });
  });
});

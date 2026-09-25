import { describe, expect, it } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from './prisma-user-repository';

describe('PrismaUserRepository errors (REQ-125)', () => {
  it('REQ-125: a Prisma error that quotes the hash is replaced by a sanitized one', async () => {
    const leaky = Object.assign(
      new Error(
        'Invalid `prisma.user.update()` invocation: { data: { passwordHash: "scrypt$secret-hash" } }',
      ),
      { code: 'P2025' },
    );
    const fake = {
      user: {
        update: async () => {
          throw leaky;
        },
      },
    } as unknown as PrismaClient;
    const error = await new PrismaUserRepository(fake)
      .setPassword('u1', 'scrypt$secret-hash')
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('PrismaUserRepository.setPassword failed (P2025)');
    expect(String((error as Error).stack)).not.toContain('secret-hash');
    expect((error as Error).cause).toBeUndefined();

    const noCode = {
      user: {
        create: async () => {
          throw new Error('boom "scrypt$secret-hash"');
        },
      },
    } as unknown as PrismaClient;
    const createError = await new PrismaUserRepository(noCode)
      .create({ name: 'Ana', email: 'ana@example.com', passwordHash: 'scrypt$secret-hash' })
      .catch((e: unknown) => e);
    expect((createError as Error).message).toBe('PrismaUserRepository.create failed (unknown)');
  });
});

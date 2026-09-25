import type { PrismaClient } from '@prisma/client';
import type { UserRecord } from '@/domain/types';
import type { NewUser, UserRepository } from '@/repositories/interfaces';

/** Prisma-backed UserRepository (password columns on User). */
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** Throws EmailTakenError when the email already exists. */
  async create(_data: NewUser): Promise<UserRecord> {
    throw new Error('not implemented');
  }
  /** Case-insensitive match on the stored email; callers pass a normalized email. */
  async findByEmail(_email: string): Promise<UserRecord | null> {
    throw new Error('not implemented');
  }
  async findById(_id: string): Promise<UserRecord | null> {
    throw new Error('not implemented');
  }
  /** Stores a new hash and sets passwordNotice to false. */
  async setPassword(_id: string, _passwordHash: string): Promise<void> {
    throw new Error('not implemented');
  }
  /** Sets passwordHash to null, passwordClearedAt to `at` and passwordNotice to true. */
  async clearPassword(_id: string, _at: Date): Promise<void> {
    throw new Error('not implemented');
  }
  /** Sets passwordNotice to false. */
  async dismissPasswordNotice(_id: string): Promise<void> {
    throw new Error('not implemented');
  }
}

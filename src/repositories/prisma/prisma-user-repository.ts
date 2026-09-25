import { Prisma, type PrismaClient } from '@prisma/client';
import { EmailTakenError } from '@/domain/errors';
import type { UserRecord } from '@/domain/types';
import type { NewUser, UserRepository } from '@/repositories/interfaces';

const USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  passwordHash: true,
  passwordClearedAt: true,
  passwordNotice: true,
} as const;

/** Replaces any Prisma error by one that cannot quote query data such as the hash (REQ-125). */
function sanitized(method: string, error: unknown): Error {
  const code =
    typeof (error as { code?: unknown })?.code === 'string'
      ? (error as { code: string }).code
      : 'unknown';
  return new Error(`PrismaUserRepository.${method} failed (${code})`);
}

/** Prisma-backed UserRepository (password columns on User). */
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** Throws EmailTakenError when the email already exists. */
  async create(data: NewUser): Promise<UserRecord> {
    try {
      return await this.prisma.user.create({ data, select: USER_FIELDS });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new EmailTakenError();
      }
      throw sanitized('create', error);
    }
  }
  /** Case-insensitive match on the stored email; callers pass a normalized email. */
  async findByEmail(email: string): Promise<UserRecord | null> {
    try {
      return await this.prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: USER_FIELDS,
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      throw sanitized('findByEmail', error);
    }
  }
  async findById(id: string): Promise<UserRecord | null> {
    try {
      return await this.prisma.user.findUnique({ where: { id }, select: USER_FIELDS });
    } catch (error) {
      throw sanitized('findById', error);
    }
  }
  /** Stores a new hash and sets passwordNotice to false. */
  async setPassword(id: string, passwordHash: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { passwordHash, passwordNotice: false },
      });
    } catch (error) {
      throw sanitized('setPassword', error);
    }
  }
  /** Sets passwordHash to null, passwordClearedAt to `at` and passwordNotice to true. */
  async clearPassword(id: string, at: Date): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { passwordHash: null, passwordClearedAt: at, passwordNotice: true },
      });
    } catch (error) {
      throw sanitized('clearPassword', error);
    }
  }
  /** Sets passwordNotice to false. */
  async dismissPasswordNotice(id: string): Promise<void> {
    try {
      await this.prisma.user.update({ where: { id }, data: { passwordNotice: false } });
    } catch (error) {
      throw sanitized('dismissPasswordNotice', error);
    }
  }
}

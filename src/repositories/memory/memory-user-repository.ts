import { EmailTakenError } from '@/domain/errors';
import type { UserRecord } from '@/domain/types';
import type { NewUser, UserRepository } from '@/repositories/interfaces';
import type { MemoryStore } from './memory-store';

/** In-memory UserRepository fake for unit tests. */
export class MemoryUserRepository implements UserRepository {
  constructor(private readonly store: MemoryStore) {}

  /** Throws EmailTakenError when the email already exists. */
  async create(data: NewUser): Promise<UserRecord> {
    if (this.store.users.some((user) => user.email?.toLowerCase() === data.email.toLowerCase())) {
      throw new EmailTakenError();
    }
    const record: UserRecord = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      passwordClearedAt: null,
      passwordNotice: false,
    };
    this.store.users.push(record);
    return { ...record };
  }

  /** Case-insensitive match on the stored email; callers pass a normalized email. */
  async findByEmail(email: string): Promise<UserRecord | null> {
    const found = this.store.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    return found ? { ...found } : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const found = this.store.users.find((user) => user.id === id);
    return found ? { ...found } : null;
  }

  /** Stores a new hash and sets passwordNotice to false. */
  async setPassword(id: string, passwordHash: string): Promise<void> {
    const record = this.store.users.find((user) => user.id === id);
    if (!record) throw new Error('not found');
    record.passwordHash = passwordHash;
    record.passwordNotice = false;
  }

  /** Sets passwordHash to null, passwordClearedAt to `at` and passwordNotice to true. */
  async clearPassword(id: string, at: Date): Promise<void> {
    const record = this.store.users.find((user) => user.id === id);
    if (!record) throw new Error('not found');
    record.passwordHash = null;
    record.passwordClearedAt = at;
    record.passwordNotice = true;
  }

  /** Sets passwordNotice to false. */
  async dismissPasswordNotice(id: string): Promise<void> {
    const record = this.store.users.find((user) => user.id === id);
    if (!record) throw new Error('not found');
    record.passwordNotice = false;
  }
}

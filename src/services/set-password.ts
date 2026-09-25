import type { PasswordHasher } from '@/lib/password';
import type { UserRepository } from '@/repositories/interfaces';

/** Sets or changes the signed-in user's password (REQ-120). */
export class SetPasswordService {
  constructor(private readonly deps: { users: UserRepository; hasher: PasswordHasher }) {}

  /** A user with a password must give it; storing a password also lowers the cleared-password notice. */
  async execute(_input: { userId: string | null; values: unknown }): Promise<void> {
    throw new Error('not implemented');
  }
}

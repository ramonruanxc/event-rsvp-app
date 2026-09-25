import type { AccountView } from '@/domain/types';
import type { UserRepository } from '@/repositories/interfaces';

/** Reads what the Account page and the password notice show (REQ-123, REQ-128). */
export class GetAccountService {
  constructor(private readonly deps: { users: UserRepository }) {}

  /** The user's email, whether a password is set, and whether the cleared-password notice is pending. */
  async execute(_input: { userId: string | null }): Promise<AccountView> {
    throw new Error('not implemented');
  }
}

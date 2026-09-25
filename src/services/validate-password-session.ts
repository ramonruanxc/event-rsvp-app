import { passwordSessionValid } from '@/domain/account-policy';
import type { UserRepository } from '@/repositories/interfaces';

/** Decides whether a JWT session is still valid (REQ-122). */
export class ValidatePasswordSessionService {
  constructor(private readonly deps: { users: UserRepository }) {}

  /** Password sessions opened before the password was cleared are no longer valid; other sessions always are. */
  async execute(input: { userId: string; pwdAt: unknown }): Promise<boolean> {
    if (typeof input.pwdAt !== 'number') return true;
    return passwordSessionValid(input.pwdAt, await this.deps.users.findById(input.userId));
  }
}

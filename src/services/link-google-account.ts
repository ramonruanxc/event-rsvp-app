import type { Clock } from '@/domain/types';
import type { UserRepository } from '@/repositories/interfaces';

/** Runs when Auth.js links an OAuth account to a user (REQ-122). */
export class LinkGoogleAccountService {
  constructor(private readonly deps: { users: UserRepository; now: Clock }) {}

  /** For Google and a user with a password: clears it, records when, raises the notice; true when it cleared. */
  async execute(input: { userId: string; provider: string }): Promise<boolean> {
    if (input.provider !== 'google') return false;
    const user = await this.deps.users.findById(input.userId);
    if (!user || user.passwordHash === null) return false;
    await this.deps.users.clearPassword(user.id, this.deps.now());
    return true;
  }
}

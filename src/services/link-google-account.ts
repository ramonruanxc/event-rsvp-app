import type { Clock } from '@/domain/types';
import type { UserRepository } from '@/repositories/interfaces';

/** Runs when Auth.js links an OAuth account to a user (REQ-122). */
export class LinkGoogleAccountService {
  constructor(private readonly deps: { users: UserRepository; now: Clock }) {}

  /** For Google and a user with a password: clears it, records when, raises the notice; true when it cleared. */
  async execute(_input: { userId: string; provider: string }): Promise<boolean> {
    throw new Error('not implemented');
  }
}

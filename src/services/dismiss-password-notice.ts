import type { UserRepository } from '@/repositories/interfaces';

/** Dismisses the cleared-password notice (REQ-123). */
export class DismissPasswordNoticeService {
  constructor(private readonly deps: { users: UserRepository }) {}

  /** Lowers the notice for the signed-in user. */
  async execute(_input: { userId: string | null }): Promise<void> {
    throw new Error('not implemented');
  }
}

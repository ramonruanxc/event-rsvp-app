import { UnauthenticatedError } from '@/domain/errors';
import type { UserRepository } from '@/repositories/interfaces';

/** Dismisses the cleared-password notice (REQ-123). */
export class DismissPasswordNoticeService {
  constructor(private readonly deps: { users: UserRepository }) {}

  /** Lowers the notice for the signed-in user. */
  async execute(input: { userId: string | null }): Promise<void> {
    if (!input.userId) throw new UnauthenticatedError();
    const user = await this.deps.users.findById(input.userId);
    if (!user) throw new UnauthenticatedError();
    await this.deps.users.dismissPasswordNotice(user.id);
  }
}

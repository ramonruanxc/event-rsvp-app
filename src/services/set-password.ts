import { UnauthenticatedError, ValidationError } from '@/domain/errors';
import { setPasswordInputSchema } from '@/domain/schemas';
import type { PasswordHasher } from '@/lib/password';
import type { UserRepository } from '@/repositories/interfaces';

/** Sets or changes the signed-in user's password (REQ-120). */
export class SetPasswordService {
  constructor(private readonly deps: { users: UserRepository; hasher: PasswordHasher }) {}

  /** A user with a password must give it; storing a password also lowers the cleared-password notice. */
  async execute(input: { userId: string | null; values: unknown }): Promise<void> {
    if (!input.userId) throw new UnauthenticatedError();
    const user = await this.deps.users.findById(input.userId);
    if (!user) throw new UnauthenticatedError();
    const parsed = setPasswordInputSchema.safeParse(input.values);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);
    const { currentPassword, newPassword } = parsed.data;
    if (user.passwordHash !== null) {
      if (currentPassword === '') throw new ValidationError({ currentPassword: 'required' });
      if (!(await this.deps.hasher.verify(currentPassword, user.passwordHash))) {
        throw new ValidationError({ currentPassword: 'currentPasswordIncorrect' });
      }
    }
    await this.deps.users.setPassword(user.id, await this.deps.hasher.hash(newPassword));
  }
}

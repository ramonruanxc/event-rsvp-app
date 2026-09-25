import type { PasswordHasher } from '@/lib/password';
import type { AuthUser } from '@/domain/types';
import type { UserRepository } from '@/repositories/interfaces';
import type { RateLimiter } from './rate-limiter';

/** Registers a password account (REQ-116, REQ-117). */
export class RegisterUserService {
  constructor(
    private readonly deps: {
      users: UserRepository;
      rateLimiter: RateLimiter;
      hasher: PasswordHasher;
    },
  ) {}

  /** Creates the user, or refuses an email that already has an account; never changes an existing user. */
  async execute(_input: { values: unknown; ipHash: string }): Promise<AuthUser> {
    throw new Error('not implemented');
  }
}

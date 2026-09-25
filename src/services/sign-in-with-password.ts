import type { PasswordHasher } from '@/lib/password';
import type { AuthUser } from '@/domain/types';
import type { UserRepository } from '@/repositories/interfaces';
import type { RateLimiter } from './rate-limiter';

/** Signs in with email and password (REQ-118, REQ-119). */
export class SignInWithPasswordService {
  constructor(
    private readonly deps: {
      users: UserRepository;
      rateLimiter: RateLimiter;
      hasher: PasswordHasher;
    },
  ) {}

  /** Returns the user for a matching password; one InvalidCredentialsError for any failure; limits failures. */
  async execute(_input: { values: unknown; ipHash: string }): Promise<AuthUser> {
    throw new Error('not implemented');
  }
}

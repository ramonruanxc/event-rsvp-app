import { InvalidCredentialsError, RateLimitedError } from '@/domain/errors';
import { signInInputSchema } from '@/domain/schemas';
import type { AuthUser } from '@/domain/types';
import { hashToken } from '@/lib/crypto';
import { DUMMY_PASSWORD_HASH, type PasswordHasher } from '@/lib/password';
import type { UserRepository } from '@/repositories/interfaces';
import { SIGNIN_EMAIL_RULE, SIGNIN_IP_RULE, type RateLimiter } from './rate-limiter';

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
  async execute(input: { values: unknown; ipHash: string }): Promise<AuthUser> {
    const parsed = signInInputSchema.safeParse(input.values);
    if (!parsed.success) throw new InvalidCredentialsError();
    const { email, password } = parsed.data;
    const { users, rateLimiter, hasher } = this.deps;
    const emailKey = hashToken(email);
    if (
      (await rateLimiter.isBlocked(SIGNIN_EMAIL_RULE, emailKey)) ||
      (await rateLimiter.isBlocked(SIGNIN_IP_RULE, input.ipHash))
    ) {
      throw new RateLimitedError();
    }
    const user = await users.findByEmail(email);
    const stored = user?.passwordHash ?? null;
    const matches = await hasher.verify(password, stored ?? DUMMY_PASSWORD_HASH);
    if (!user || stored === null || !matches) {
      await rateLimiter.consume(SIGNIN_EMAIL_RULE, emailKey);
      await rateLimiter.consume(SIGNIN_IP_RULE, input.ipHash);
      throw new InvalidCredentialsError();
    }
    return { id: user.id, name: user.name, email: user.email ?? email };
  }
}

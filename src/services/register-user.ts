import {
  EmailTakenError,
  GoogleAccountExistsError,
  RateLimitedError,
  ValidationError,
} from '@/domain/errors';
import { registerInputSchema } from '@/domain/schemas';
import type { AuthUser } from '@/domain/types';
import type { PasswordHasher } from '@/lib/password';
import type { UserRepository } from '@/repositories/interfaces';
import { SIGNIN_IP_RULE, type RateLimiter } from './rate-limiter';

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
  async execute(input: { values: unknown; ipHash: string }): Promise<AuthUser> {
    const parsed = registerInputSchema.safeParse(input.values);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);
    const { name, email, password } = parsed.data;
    const { users, rateLimiter, hasher } = this.deps;
    if (await rateLimiter.isBlocked(SIGNIN_IP_RULE, input.ipHash)) throw new RateLimitedError();
    const existing = await users.findByEmail(email);
    if (existing) {
      await rateLimiter.consume(SIGNIN_IP_RULE, input.ipHash);
      throw existing.passwordHash === null ? new GoogleAccountExistsError() : new EmailTakenError();
    }
    const user = await users.create({ name, email, passwordHash: await hasher.hash(password) });
    return { id: user.id, name: user.name, email };
  }
}

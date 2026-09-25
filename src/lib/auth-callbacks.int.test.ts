import { beforeEach, describe, expect, it } from 'vitest';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { InvalidCredentialsError } from '@/domain/errors';
import { prisma } from '@/lib/prisma';
import { hashPassword, scryptPasswordHasher } from '@/lib/password';
import { PrismaRateLimitRepository } from '@/repositories/prisma/prisma-rate-limit-repository';
import { PrismaUserRepository } from '@/repositories/prisma/prisma-user-repository';
import { LinkGoogleAccountService } from '@/services/link-google-account';
import { RateLimiter } from '@/services/rate-limiter';
import { SignInWithPasswordService } from '@/services/sign-in-with-password';
import { resetDatabase } from '@/test/db';
import { createAuthCallbacks } from './auth-callbacks';

const linkedAt = new Date('2026-09-25T12:00:00.000Z');

function arrange() {
  const users = new PrismaUserRepository(prisma);
  const rateLimiter = new RateLimiter({ repo: new PrismaRateLimitRepository(prisma), now: () => new Date() });
  const signInService = new SignInWithPasswordService({ users, rateLimiter, hasher: scryptPasswordHasher });
  const linkService = new LinkGoogleAccountService({ users, now: () => linkedAt });
  const callbacks = createAuthCallbacks({
    signInWithPassword: (input) => signInService.execute(input),
    validatePasswordSession: async () => true,
    linkGoogleAccount: (input) => linkService.execute(input),
    currentSessionEmail: async () => null,
    ipSalt: () => 'salt',
    now: () => Date.now(),
  });
  return { callbacks, signInService };
}

/** What Auth.js does when Google signs in with the email of an existing user: write the account, fire the event. */
async function linkGoogle(callbacks: ReturnType<typeof createAuthCallbacks>, userId: string) {
  const account = { userId, type: 'oidc' as const, provider: 'google', providerAccountId: 'google-123' };
  await PrismaAdapter(prisma).linkAccount!(account);
  await callbacks.linkAccount({ user: { id: userId }, account });
}

describe('Google linking (integration)', () => {
  beforeEach(resetDatabase);

  it('REQ-122: linking Google to a password account clears the password and raises the notice', async () => {
    const { callbacks, signInService } = arrange();
    const user = await prisma.user.create({
      data: { email: 'ana@example.com', name: 'Ana', passwordHash: await hashPassword('correct horse') },
    });

    await linkGoogle(callbacks, user.id);

    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { accounts: true } });
    expect(row.passwordHash).toBeNull();
    expect(row.passwordNotice).toBe(true);
    expect(row.passwordClearedAt).toEqual(linkedAt);
    expect(row.accounts.map((a) => a.provider)).toEqual(['google']);
    await expect(
      signInService.execute({ values: { email: 'ana@example.com', password: 'correct horse' }, ipHash: 'h1' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('REQ-122: a user without a password is left unchanged by the link', async () => {
    const { callbacks } = arrange();
    const user = await prisma.user.create({ data: { email: 'gil@example.com', name: 'Gil' } });
    await linkGoogle(callbacks, user.id);
    const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(row).toMatchObject({ passwordHash: null, passwordClearedAt: null, passwordNotice: false });
  });
});

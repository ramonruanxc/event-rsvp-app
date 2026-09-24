import { PrismaClient } from '@prisma/client';

/** Prisma client pointed at the test database (DATABASE_URL from .env.test). */
export const db = new PrismaClient();

/** Empties every table between tests. */
export async function resetDatabase(): Promise<void> {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "Rsvp", "Event", "Session", "Account", "VerificationToken", "User", "RateLimit" CASCADE',
  );
}

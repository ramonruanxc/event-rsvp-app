import { prisma } from '@/lib/prisma';
import { generateSlug } from '@/domain/slug';
import type { EventRecord } from '@/domain/types';
import type { NewEvent } from '@/repositories/interfaces';

/** Empties every table between integration tests. */
export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Rsvp", "Event", "Session", "Account", "VerificationToken", "User", "RateLimit" CASCADE',
  );
}

/** Creates a user row for tests that need an event owner. */
export async function createUser(email = 'owner@example.com'): Promise<{ id: string }> {
  const user = await prisma.user.create({ data: { email } });
  return { id: user.id };
}

/** Creates an event row owned by ownerId, with sensible defaults for the other fields. */
export async function createEventRow(
  ownerId: string,
  overrides: Partial<NewEvent> = {},
): Promise<EventRecord> {
  return prisma.event.create({
    data: {
      slug: generateSlug(),
      ownerId,
      name: 'Team dinner',
      description: 'Pasta night',
      location: null,
      startsAt: new Date('2030-01-01T19:00:00.000Z'),
      timezone: 'UTC',
      ...overrides,
    },
  });
}

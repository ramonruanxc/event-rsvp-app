import { randomUUID } from 'node:crypto';
import { nanoid } from 'nanoid';
import { toNameKey } from '@/domain/name-key';
import { hashToken } from '@/lib/crypto';
import { db } from './db';

/** Creates an event owner directly in the database, without going through Google sign-in. */
export async function createOwner(email = `owner-${randomUUID()}@example.com`): Promise<{
  id: string;
}> {
  const user = await db.user.create({ data: { email, name: 'Owner' } });
  return { id: user.id };
}

/** Creates an event, defaulting to a week from now in America/New_York. */
export async function createEvent(
  ownerId: string,
  overrides: {
    name?: string;
    description?: string;
    startsAt?: Date;
    timezone?: string;
    location?: string | null;
  } = {},
): Promise<{ id: string; slug: string }> {
  const event = await db.event.create({
    data: {
      slug: nanoid(10),
      ownerId,
      name: overrides.name ?? 'Team dinner',
      description: overrides.description ?? 'Pasta night',
      location: overrides.location ?? null,
      startsAt: overrides.startsAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      timezone: overrides.timezone ?? 'America/New_York',
    },
  });
  return { id: event.id, slug: event.slug };
}

/** Creates an RSVP directly in the database, with a random edit token no fixture holds. */
export async function createRsvp(
  eventId: string,
  name: string,
  status: 'GOING' | 'NOT_GOING' = 'GOING',
  partySize?: number,
): Promise<void> {
  await db.rsvp.create({
    data: {
      eventId,
      name,
      nameKey: toNameKey(name),
      status,
      partySize: partySize ?? (status === 'GOING' ? 1 : 0),
      editTokenHash: hashToken(randomUUID()),
    },
  });
}

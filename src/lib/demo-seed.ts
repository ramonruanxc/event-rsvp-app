import type { PrismaClient } from '@prisma/client';
import { addDaysToDateString, toLocalParts, toStartsAt } from '@/domain/event-time';
import { toNameKey } from '@/domain/name-key';
import { SAMPLE_GUESTS } from '@/domain/sample';
import { generateEditToken, hashToken } from '@/lib/crypto';

/** Slug of the public, seeded demo event (REQ-40). */
export const DEMO_SLUG = 'demoPicnic';
/** Email of the demo event's owner account (REQ-40). */
export const DEMO_EMAIL = 'demo@event-rsvp.invalid';

const DEMO_TIMEZONE = 'America/New_York';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Creates the public demo event if missing, and keeps it open for evaluators (REQ-40, BR-52). */
export async function seedDemo(prisma: PrismaClient, now: Date): Promise<void> {
  const owner = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: 'Demo organizer' },
  });

  const today = toLocalParts(now, DEMO_TIMEZONE).date;
  const target = toStartsAt(addDaysToDateString(today, 30), '18:00', DEMO_TIMEZONE);

  const existing = await prisma.event.findUnique({ where: { slug: DEMO_SLUG } });

  if (!existing) {
    const event = await prisma.event.create({
      data: {
        slug: DEMO_SLUG,
        ownerId: owner.id,
        name: 'Community Picnic in the Park',
        description: 'Bring a blanket and something to share. Games start at 6 pm.',
        location: 'Riverside Park',
        startsAt: target,
        timezone: DEMO_TIMEZONE,
      },
    });
    await prisma.rsvp.createMany({
      data: SAMPLE_GUESTS.map((guest) => ({
        eventId: event.id,
        name: guest.name,
        nameKey: toNameKey(guest.name),
        status: guest.status,
        partySize: guest.partySize,
        editTokenHash: hashToken(generateEditToken()),
      })),
    });
    return;
  }

  if (existing.startsAt.getTime() - now.getTime() < SEVEN_DAYS_MS) {
    await prisma.event.update({ where: { id: existing.id }, data: { startsAt: target } });
  }
}

import type { PrismaClient } from '@prisma/client';

/** Slug of the public, seeded demo event (REQ-40). */
export const DEMO_SLUG = 'demoPicnic';
/** Email of the demo event's owner account (REQ-40). */
export const DEMO_EMAIL = 'demo@event-rsvp.invalid';

/** Creates the public demo event if missing, and keeps it open for evaluators (REQ-40, BR-52). */
export async function seedDemo(_prisma: PrismaClient, _now: Date): Promise<void> {
  throw new Error('not implemented');
}

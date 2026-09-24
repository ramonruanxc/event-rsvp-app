import { ValidationError } from './errors';
import type { EventRecord } from './types';

/** Throws ValidationError({ date: 'inPast' }) when startsAt is strictly before now (BR-21, BR-90). */
export function assertNotInPast(startsAt: Date, now: Date): void {
  if (startsAt.getTime() < now.getTime()) {
    throw new ValidationError({ date: 'inPast' });
  }
}

/** True when userId is the event's owner; a null userId is never the owner (BR-03, BR-86). */
export function isOwner(_event: Pick<EventRecord, 'ownerId'>, _userId: string | null): boolean {
  throw new Error('not implemented');
}

/** Throws NotOwnerError unless userId is the event's owner. */
export function assertOwner(_event: Pick<EventRecord, 'ownerId'>, _userId: string | null): void {
  throw new Error('not implemented');
}

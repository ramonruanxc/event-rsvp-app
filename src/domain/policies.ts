import { NotOwnerError, ValidationError } from './errors';
import type { EventRecord } from './types';

/** Throws ValidationError({ date: 'inPast' }) when startsAt is strictly before now (BR-21, BR-90). */
export function assertNotInPast(startsAt: Date, now: Date): void {
  if (startsAt.getTime() < now.getTime()) {
    throw new ValidationError({ date: 'inPast' });
  }
}

/** True when userId is the event's owner; a null userId is never the owner (BR-03, BR-86). */
export function isOwner(event: Pick<EventRecord, 'ownerId'>, userId: string | null): boolean {
  return userId !== null && userId === event.ownerId;
}

/** Throws NotOwnerError unless userId is the event's owner. */
export function assertOwner(event: Pick<EventRecord, 'ownerId'>, userId: string | null): void {
  if (!isOwner(event, userId)) {
    throw new NotOwnerError();
  }
}

/** True once now is strictly after the event's start time; equal to start is still open (BR-32, BR-33). */
export function hasEnded(_event: Pick<EventRecord, 'startsAt'>, _now: Date): boolean {
  throw new Error('not implemented');
}

/** Throws EventEndedError once the event has started. */
export function assertNotEnded(_event: Pick<EventRecord, 'startsAt'>, _now: Date): void {
  throw new Error('not implemented');
}

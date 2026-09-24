import { ValidationError } from './errors';

/** Throws ValidationError({ date: 'inPast' }) when startsAt is strictly before now (BR-21, BR-90). */
export function assertNotInPast(startsAt: Date, now: Date): void {
  if (startsAt.getTime() < now.getTime()) {
    throw new ValidationError({ date: 'inPast' });
  }
}

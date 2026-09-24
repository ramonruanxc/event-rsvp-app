import { ValidationError } from './errors';

/** Throws ValidationError({ date: 'inPast' }) when startsAt is strictly before now (BR-21, BR-90). */
export function assertNotInPast(_startsAt: Date, _now: Date): void {
  throw new Error('not implemented');
}

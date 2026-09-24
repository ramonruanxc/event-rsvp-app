import type { RsvpRecord, Totals } from './types';

/** Aggregates RSVP counts: going/declined counts and total people among GOING RSVPs (BR-43, BR-44, BR-47). */
export function computeTotals(
  _rsvps: ReadonlyArray<Pick<RsvpRecord, 'status' | 'partySize'>>,
): Totals {
  throw new Error('not implemented');
}

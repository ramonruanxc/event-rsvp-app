import type { RsvpRecord, Totals } from './types';

/** Aggregates RSVP counts: going/declined counts and total people among GOING RSVPs (BR-43, BR-44, BR-47). */
export function computeTotals(
  rsvps: ReadonlyArray<Pick<RsvpRecord, 'status' | 'partySize'>>,
): Totals {
  let going = 0;
  let declined = 0;
  let people = 0;
  for (const rsvp of rsvps) {
    if (rsvp.status === 'GOING') {
      going += 1;
      people += rsvp.partySize;
    } else {
      declined += 1;
    }
  }
  return { going, declined, people };
}

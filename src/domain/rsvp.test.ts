import { describe, expect, it } from 'vitest';
import { computeTotals } from './rsvp';

describe('computeTotals', () => {
  it('REQ-32: counts going and declined RSVPs and sums going party sizes', () => {
    expect(
      computeTotals([
        { status: 'GOING', partySize: 3 },
        { status: 'GOING', partySize: 1 },
        { status: 'NOT_GOING', partySize: 0 },
      ]),
    ).toEqual({ going: 2, declined: 1, people: 4 });
  });

  it('REQ-32: an empty list gives zeros', () => {
    expect(computeTotals([])).toEqual({ going: 0, declined: 0, people: 0 });
  });
});

import { describe, expect, it } from 'vitest';
import { toLocalParts, toStartsAt } from './event-time';

describe('toStartsAt', () => {
  it('REQ-09: 19:00 in New York in October is 23:00 UTC', () => {
    expect(toStartsAt('2026-10-02', '19:00', 'America/New_York').toISOString()).toBe(
      '2026-10-02T23:00:00.000Z',
    );
  });

  it('REQ-09: 19:00 in New York in December rolls over to the next UTC day', () => {
    expect(toStartsAt('2026-12-15', '19:00', 'America/New_York').toISOString()).toBe(
      '2026-12-16T00:00:00.000Z',
    );
  });

  it('REQ-09: 19:00 in Fortaleza is 22:00 UTC', () => {
    expect(toStartsAt('2026-10-02', '19:00', 'America/Fortaleza').toISOString()).toBe(
      '2026-10-02T22:00:00.000Z',
    );
  });
});

describe('toLocalParts', () => {
  it("REQ-09: toLocalParts converts back to the event's local date and time", () => {
    expect(toLocalParts(new Date('2026-10-02T23:00:00.000Z'), 'America/New_York')).toEqual({
      date: '2026-10-02',
      time: '19:00',
    });
  });
});

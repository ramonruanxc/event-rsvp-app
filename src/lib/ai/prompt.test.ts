import { describe, expect, it } from 'vitest';
import { buildReferenceLine } from './prompt';

describe('buildReferenceLine', () => {
  it("REQ-44: the reference uses the organizer's local day", () => {
    expect(buildReferenceLine(new Date('2026-09-25T02:00:00.000Z'), 'America/Fortaleza')).toBe(
      'Today is Thursday 2026-09-24 23:00, America/Fortaleza.',
    );
  });

  it('REQ-44: without a timezone the reference is UTC and says so', () => {
    expect(buildReferenceLine(new Date('2026-09-24T15:00:00.000Z'), null)).toBe(
      "Today is Thursday 2026-09-24 15:00, UTC. The organizer's timezone is unknown.",
    );
  });
});

import { describe, expect, it } from 'vitest';
import { buildIcs, escapeIcsText, foldIcsLine } from './ics';

describe('escapeIcsText', () => {
  it('REQ-41: escapes backslash, semicolon, comma and newlines', () => {
    expect(escapeIcsText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne');
  });

  it('REQ-41: a CRLF counts as one newline', () => {
    expect(escapeIcsText('a\r\nb')).toBe('a\\nb');
  });
});

describe('foldIcsLine', () => {
  it('REQ-41: folds lines longer than 75 octets', () => {
    const input = 'SUMMARY:' + 'a'.repeat(200);
    const folded = foldIcsLine(input);
    const parts = folded.split('\r\n');

    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) {
      expect(Buffer.byteLength(part)).toBeLessThanOrEqual(75);
    }
    for (const part of parts.slice(1)) {
      expect(part.startsWith(' ')).toBe(true);
    }
    expect(folded.replace(/\r\n /g, '')).toBe(input);
  });

  it('REQ-41: never splits a multi-byte character', () => {
    const input = 'SUMMARY:' + 'é'.repeat(100);
    const folded = foldIcsLine(input);

    expect(folded.replace(/\r\n /g, '')).toBe(input);
  });
});

describe('buildIcs', () => {
  const event = {
    slug: 'abc',
    name: "Team dinner, Mario's",
    description: 'Line 1\nLine 2; bring \\ snacks',
    location: "Mario's",
    startsAt: new Date('2026-10-02T23:00:00.000Z'),
  };
  const now = new Date('2026-09-24T15:00:00.000Z');

  it('REQ-41: builds a 2-hour VEVENT in UTC', () => {
    const expected =
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//event-rsvp-app//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:abc@event-rsvp-app',
        'DTSTAMP:20260924T150000Z',
        'DTSTART:20261002T230000Z',
        'DTEND:20261003T010000Z',
        "SUMMARY:Team dinner\\, Mario's",
        'DESCRIPTION:Line 1\\nLine 2\\; bring \\\\ snacks',
        "LOCATION:Mario's",
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n') + '\r\n';

    expect(buildIcs(event, now)).toBe(expected);
  });

  it('REQ-41: omits LOCATION when there is none', () => {
    const result = buildIcs({ ...event, location: null }, now);

    expect(result).not.toContain('LOCATION');
  });
});

import { describe, expect, it } from 'vitest';
import { escapeIcsText, foldIcsLine } from './ics';

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

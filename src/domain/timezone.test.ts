import { describe, expect, it } from 'vitest';
import { isValidTimeZone } from './timezone';

describe('isValidTimeZone', () => {
  it('REQ-08: recognizes IANA identifiers', () => {
    for (const tz of ['America/New_York', 'UTC', 'Europe/Paris']) {
      expect(isValidTimeZone(tz)).toBe(true);
    }
    for (const tz of ['Mars/Olympus', '']) {
      expect(isValidTimeZone(tz)).toBe(false);
    }
  });
});

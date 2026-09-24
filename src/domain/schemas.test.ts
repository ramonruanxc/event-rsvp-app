import { describe, expect, it } from 'vitest';
import { eventNameSchema } from './schemas';

describe('eventNameSchema', () => {
  it('REQ-04: accepts and trims a normal name', () => {
    expect(eventNameSchema.parse('  Team dinner  ')).toBe('Team dinner');
  });

  it('REQ-04: rejects an empty or blank name as required', () => {
    for (const value of ['', '   ']) {
      const result = eventNameSchema.safeParse(value);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('required');
      }
    }
  });

  it('REQ-04: accepts 120 characters and rejects 121 as tooLong', () => {
    expect(eventNameSchema.parse('a'.repeat(120))).toBe('a'.repeat(120));
    const result = eventNameSchema.safeParse('a'.repeat(121));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('tooLong');
    }
  });
});

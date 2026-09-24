import { describe, expect, it } from 'vitest';
import { eventDescriptionSchema, eventNameSchema } from './schemas';

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

describe('eventDescriptionSchema', () => {
  it('REQ-05: accepts a short description', () => {
    expect(eventDescriptionSchema.parse('Hi')).toBe('Hi');
  });

  it('REQ-05: rejects an empty description as required', () => {
    const result = eventDescriptionSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('required');
    }
  });

  it('REQ-05: accepts 2000 characters and rejects 2001 as tooLong', () => {
    expect(eventDescriptionSchema.parse('a'.repeat(2000))).toBe('a'.repeat(2000));
    const result = eventDescriptionSchema.safeParse('a'.repeat(2001));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('tooLong');
    }
  });

  it('REQ-05: keeps inner line breaks', () => {
    expect(eventDescriptionSchema.parse('  Line 1\nLine 2 ')).toBe('Line 1\nLine 2');
  });
});

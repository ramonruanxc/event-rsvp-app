import { describe, expect, it } from 'vitest';
import {
  eventDateSchema,
  eventDescriptionSchema,
  eventLocationSchema,
  eventNameSchema,
  eventTimeSchema,
  timezoneSchema,
} from './schemas';

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

describe('eventLocationSchema', () => {
  it('REQ-06: empty or missing location becomes null', () => {
    for (const value of [undefined, null, '', '   ']) {
      expect(eventLocationSchema.parse(value)).toBe(null);
    }
  });

  it('REQ-06: location is trimmed', () => {
    expect(eventLocationSchema.parse(" Mario's ")).toBe("Mario's");
  });
});

describe('eventDateSchema and eventTimeSchema', () => {
  it('REQ-07: accepts a calendar date and a 24h time', () => {
    expect(eventDateSchema.parse('2026-10-02')).toBe('2026-10-02');
    for (const time of ['19:00', '00:00', '23:59']) {
      expect(eventTimeSchema.parse(time)).toBe(time);
    }
  });

  it('REQ-07: empty date and time are required', () => {
    const dateResult = eventDateSchema.safeParse('');
    expect(dateResult.success).toBe(false);
    if (!dateResult.success) {
      expect(dateResult.error.issues[0].message).toBe('required');
    }

    const timeResult = eventTimeSchema.safeParse('');
    expect(timeResult.success).toBe(false);
    if (!timeResult.success) {
      expect(timeResult.error.issues[0].message).toBe('required');
    }
  });

  it('REQ-07: impossible or badly formatted dates are invalidFormat', () => {
    for (const value of ['2026-02-30', '02/10/2026', '2026-13-01']) {
      const result = eventDateSchema.safeParse(value);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('invalidFormat');
      }
    }
  });

  it('REQ-07: badly formatted times are invalidFormat', () => {
    for (const value of ['24:00', '7pm', '19:60']) {
      const result = eventTimeSchema.safeParse(value);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('invalidFormat');
      }
    }
  });
});

describe('timezoneSchema', () => {
  it('REQ-08: timezone field is required and must be valid', () => {
    const emptyResult = timezoneSchema.safeParse('');
    expect(emptyResult.success).toBe(false);
    if (!emptyResult.success) {
      expect(emptyResult.error.issues[0].message).toBe('required');
    }

    const invalidResult = timezoneSchema.safeParse('Mars/Olympus');
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error.issues[0].message).toBe('invalidTimezone');
    }
  });
});

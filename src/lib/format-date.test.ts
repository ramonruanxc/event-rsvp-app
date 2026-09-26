import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  dateTileParts,
  formatEventDateTime,
  formatEventDateTimeParts,
  formatShortDateTime,
} from './format-date';

describe('formatEventDateTime', () => {
  const instant = new Date('2026-10-02T23:00:00.000Z');
  let originalTz: string | undefined;

  beforeEach(() => {
    originalTz = process.env.TZ;
    process.env.TZ = 'Asia/Tokyo';
  });

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it('REQ-12: formats for en with a 12-hour clock and the timezone abbreviation', () => {
    const result = formatEventDateTime(instant, 'America/New_York', 'en');
    expect(result).toContain('October 2, 2026');
    expect(result).toMatch(/7:00\sPM/);
    expect(result).toContain('EDT');
  });

  it('REQ-12: formats for fr with a 24-hour clock', () => {
    const result = formatEventDateTime(instant, 'America/New_York', 'fr');
    expect(result).toContain('octobre');
    expect(result).toContain('19:00');
  });

  it('REQ-12: formats for pt-BR with a 24-hour clock', () => {
    const result = formatEventDateTime(instant, 'America/New_York', 'pt-BR');
    expect(result).toContain('outubro');
    expect(result).toContain('19:00');
  });

  it('REQ-12: output does not depend on the machine timezone', () => {
    expect(process.env.TZ).toBe('Asia/Tokyo');
    const result = formatEventDateTime(instant, 'America/New_York', 'en');
    expect(result).toContain('October 2, 2026');
    expect(result).toMatch(/7:00\sPM/);
    expect(result).toContain('EDT');
  });
});

describe('dateTileParts', () => {
  it('REQ-82: the date tile shows month, day and weekday in the event timezone', () => {
    expect(dateTileParts(new Date('2026-10-02T23:00:00.000Z'), 'America/New_York', 'en')).toEqual({
      month: 'OCT',
      day: '2',
      weekday: 'Fri',
    });
    expect(dateTileParts(new Date('2026-10-03T02:00:00.000Z'), 'America/New_York', 'en')).toEqual({
      month: 'OCT',
      day: '2',
      weekday: 'Fri',
    });
    expect(dateTileParts(new Date('2026-10-02T23:00:00.000Z'), 'America/New_York', 'fr')).toEqual({
      month: 'OCT.',
      day: '2',
      weekday: 'ven.',
    });
  });
});

describe('formatShortDateTime', () => {
  it('REQ-85: the short date-time keeps the timezone label', () => {
    const result = formatShortDateTime(
      new Date('2026-09-24T14:02:00.000Z'),
      'America/New_York',
      'en',
    ).replace(/\s/g, ' ');
    expect(result).toBe('Sep 24, 10:02 AM EDT');
  });
});

describe('formatEventDateTimeParts (REQ-151)', () => {
  const instant = new Date('2026-10-02T23:00:00.000Z');

  it('REQ-151: splits before the hour and joins back to the full text in every locale', () => {
    for (const locale of ['en', 'fr', 'pt-BR']) {
      const { date, time } = formatEventDateTimeParts(instant, 'America/Sao_Paulo', locale);
      expect(date + time, locale).toBe(formatEventDateTime(instant, 'America/Sao_Paulo', locale));
      expect(time, locale).toMatch(/^(8|20):00/);
    }
  });

  it('REQ-151: in English the date ends with "at " and the time keeps its zone', () => {
    const { date, time } = formatEventDateTimeParts(instant, 'America/Sao_Paulo', 'en');
    expect(date).toBe('Friday, October 2, 2026 at ');
    expect(time).toMatch(/^8:00\sPM\sGMT-3$/);
  });
});

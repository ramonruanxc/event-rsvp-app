import { describe, expect, it } from 'vitest';
import { AiUnavailableError } from '@/domain/errors';
import { normalizeAiOutput } from './output';

const VALID_RAW = {
  isEvent: true,
  name: 'Team dinner',
  description: 'Dinner with the team.',
  date: '2026-10-02',
  time: '19:00',
  timezone: null,
  location: "Mario's",
};

describe('normalizeAiOutput', () => {
  it('REQ-43: output that does not match the schema is AiUnavailableError', () => {
    expect(() => normalizeAiOutput({ foo: 1 }, null)).toThrow(AiUnavailableError);
    expect(() => normalizeAiOutput('text', null)).toThrow(AiUnavailableError);
  });

  it('REQ-43: invalid dates and times become null', () => {
    expect(normalizeAiOutput({ ...VALID_RAW, date: '2026-02-30' }, null).fields.date).toBeNull();
    expect(normalizeAiOutput({ ...VALID_RAW, date: 'next friday' }, null).fields.date).toBeNull();
    expect(normalizeAiOutput({ ...VALID_RAW, time: '7pm' }, null).fields.time).toBeNull();
    expect(normalizeAiOutput(VALID_RAW, null).fields.time).toBe('19:00');
  });

  it('REQ-43: blank or too long texts become null', () => {
    expect(normalizeAiOutput({ ...VALID_RAW, name: '   ' }, null).fields.name).toBeNull();
    expect(normalizeAiOutput({ ...VALID_RAW, name: 'a'.repeat(121) }, null).fields.name).toBeNull();
    expect(
      normalizeAiOutput({ ...VALID_RAW, description: 'a'.repeat(2001) }, null).fields.description,
    ).toBeNull();
  });

  it('REQ-46: without a text timezone the form timezone is used, and with neither the timezone is null', () => {
    const r1 = normalizeAiOutput({ ...VALID_RAW, timezone: null }, 'America/Sao_Paulo');
    expect(r1.fields.timezone).toBe('America/Sao_Paulo');
    expect(r1.timezoneFromText).toBe(false);

    const r2 = normalizeAiOutput({ ...VALID_RAW, timezone: null }, null);
    expect(r2.fields.timezone).toBeNull();
    expect(r2.timezoneFromText).toBe(false);

    const r3 = normalizeAiOutput({ ...VALID_RAW, timezone: null }, '');
    expect(r3.fields.timezone).toBeNull();
    expect(r3.timezoneFromText).toBe(false);
  });

  it('REQ-46: a valid text timezone wins over the form; an invalid one falls back to the form', () => {
    const r1 = normalizeAiOutput({ ...VALID_RAW, timezone: 'Mars/Olympus' }, 'America/Sao_Paulo');
    expect(r1.fields.timezone).toBe('America/Sao_Paulo');
    expect(r1.timezoneFromText).toBe(false);

    const r2 = normalizeAiOutput(
      { ...VALID_RAW, timezone: 'America/New_York' },
      'America/Sao_Paulo',
    );
    expect(r2.fields.timezone).toBe('America/New_York');
    expect(r2.timezoneFromText).toBe(true);
  });

  it('REQ-45: missing lists every null field in form order', () => {
    const r1 = normalizeAiOutput(
      { ...VALID_RAW, date: null, time: null, location: null },
      'America/New_York',
    );
    expect(r1.missing).toEqual(['date', 'time', 'location']);
    expect(r1.notAnEvent).toBe(false);

    const r2 = normalizeAiOutput(VALID_RAW, 'America/New_York');
    expect(r2.missing).toEqual([]);
  });

  it('REQ-46: with no timezone in the text or the form, timezone is missing', () => {
    expect(normalizeAiOutput(VALID_RAW, null).missing).toEqual(['timezone']);
    expect(normalizeAiOutput(VALID_RAW, '').missing).toEqual(['timezone']);
  });
});

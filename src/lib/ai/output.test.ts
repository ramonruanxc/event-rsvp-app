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
    expect(
      normalizeAiOutput({ ...VALID_RAW, name: 'a'.repeat(121) }, null).fields.name,
    ).toBeNull();
    expect(
      normalizeAiOutput({ ...VALID_RAW, description: 'a'.repeat(2001) }, null).fields.description,
    ).toBeNull();
  });
});

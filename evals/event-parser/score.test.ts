import { describe, expect, it } from 'vitest';
import type { ParseEventResult } from '@/lib/ai/types';
import { matches, scoreCase } from './score';
import type { EvalCase } from './types';

const baseCase = (expected: EvalCase['expected']): EvalCase => ({
  id: 'case-1',
  category: 'explicit',
  input: { text: 'Team dinner', timezone: 'America/New_York', now: '2026-09-24T15:00:00Z' },
  expected,
});

const baseResult: ParseEventResult = {
  fields: {
    name: 'Team dinner',
    description: 'Dinner with the team.',
    date: '2026-10-02',
    time: '19:00',
    timezone: 'America/New_York',
    location: "Mario's",
  },
  missing: [],
  timezoneFromText: false,
  notAnEvent: false,
};

describe('matches (REQ-91)', () => {
  it('REQ-91: a string matcher compares equal after trim and lower-case', () => {
    expect(matches('Team Dinner', '  TEAM DINNER  ')).toBe(true);
    expect(matches('Team Dinner', 'Book Club')).toBe(false);
  });

  it('REQ-91: a null matcher requires a null actual value', () => {
    expect(matches(null, null)).toBe(true);
    expect(matches(null, 'x')).toBe(false);
  });

  it('REQ-91: an includes matcher checks the actual contains the substring', () => {
    expect(matches({ includes: 'mario' }, "Mario's Trattoria")).toBe(true);
    expect(matches({ includes: 'mario' }, 'Central Library')).toBe(false);
  });

  it('REQ-91: an excludes matcher passes when the actual is null or lacks the substring', () => {
    expect(matches({ excludes: 'hacked' }, null)).toBe(true);
    expect(matches({ excludes: 'hacked' }, 'Team lunch')).toBe(true);
    expect(matches({ excludes: 'hacked' }, 'HACKED')).toBe(false);
  });

  it('REQ-91: an anyOf matcher checks the actual equals one of the options', () => {
    expect(matches({ anyOf: ['a', 'b'] }, 'B')).toBe(true);
    expect(matches({ anyOf: ['a', 'b'] }, 'c')).toBe(false);
  });

  it('REQ-91: a present matcher checks the actual is a non-empty string', () => {
    expect(matches({ present: true }, 'x')).toBe(true);
    expect(matches({ present: true }, null)).toBe(false);
    expect(matches({ present: true }, '   ')).toBe(false);
  });

  it('REQ-91: a combined matcher requires every key it holds to pass', () => {
    expect(matches({ includes: 'lunch', excludes: 'hacked' }, 'Team lunch')).toBe(true);
    expect(matches({ includes: 'lunch', excludes: 'hacked' }, 'Team lunch HACKED')).toBe(false);
  });
});

describe('scoreCase (REQ-91)', () => {
  it('REQ-91: missing compares as a set', () => {
    const evalCase = baseCase({ missing: ['date', 'location'] });
    const passing = scoreCase(evalCase, { ...baseResult, missing: ['location', 'date'] });
    expect(passing.passed).toBe(true);
    const failing = scoreCase(evalCase, { ...baseResult, missing: ['date'] });
    expect(failing.passed).toBe(false);
  });

  it('REQ-91: a case passes only if every checked field passes', () => {
    const evalCase = baseCase({ name: { includes: 'dinner' }, date: '2026-01-01' });
    const result = scoreCase(evalCase, baseResult);
    expect(result.passed).toBe(false);
    expect(result.fields).toContainEqual({
      field: 'name',
      passed: true,
      expected: { includes: 'dinner' },
      actual: 'Team dinner',
    });
    expect(result.fields).toContainEqual({
      field: 'date',
      passed: false,
      expected: '2026-01-01',
      actual: '2026-10-02',
    });
  });

  it('REQ-91: notAnEvent is compared when expected', () => {
    const evalCase = baseCase({ notAnEvent: true });
    const failing = scoreCase(evalCase, { ...baseResult, notAnEvent: false });
    expect(failing.fields).toContainEqual({
      field: 'notAnEvent',
      passed: false,
      expected: true,
      actual: false,
    });
    expect(failing.passed).toBe(false);

    const passing = scoreCase(evalCase, { ...baseResult, notAnEvent: true });
    expect(passing.passed).toBe(true);

    const noExpectation = scoreCase(baseCase({}), baseResult);
    expect(noExpectation.fields.find((f) => f.field === 'notAnEvent')).toBeUndefined();
  });

  it('REQ-91: an error fails every checked field', () => {
    const evalCase = baseCase({ name: { includes: 'dinner' }, date: '2026-10-02' });
    const result = scoreCase(evalCase, { error: 'AiUnavailableError' });
    expect(result.passed).toBe(false);
    expect(result.error).toBe('AiUnavailableError');
    expect(result.fields.every((f) => f.passed === false)).toBe(true);
  });
});

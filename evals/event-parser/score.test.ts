import { describe, expect, it } from 'vitest';
import type { ParseEventResult } from '@/lib/ai/types';
import {
  GATE_CATEGORY,
  GATE_OVERALL,
  gate,
  matches,
  scoreCase,
  summarize,
  summarizeEval,
} from './score';
import type { CaseRuns, Category, CaseResult, EvalCase, RunResult, RunStatus } from './types';

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

describe('scoreCase description facts (REQ-102)', () => {
  const TERMS = ['\\b\\d{1,2}\\s*(a\\.?m|p\\.?m)\\b', 'saturday'];
  const facts = (description: string | null) =>
    scoreCase(baseCase({ forbiddenInDescription: TERMS }), {
      ...baseResult,
      fields: { ...baseResult.fields, description },
    });

  it('REQ-102: a description with a forbidden pattern fails the case', () => {
    const withTime = facts('Dinner with the team at 7 p.m.');
    expect(withTime.passed).toBe(false);
    expect(withTime.fields).toContainEqual({
      field: 'descriptionFacts',
      passed: false,
      expected: { noneOf: TERMS },
      actual: 'Dinner with the team at 7 p.m.',
    });
    expect(facts('Team dinner on Saturday.').passed).toBe(false);
  });

  it('REQ-102: a description without forbidden patterns, or no description, passes the check', () => {
    const clean = facts('Dinner with the team.');
    expect(clean.passed).toBe(true);
    expect(clean.fields).toContainEqual({
      field: 'descriptionFacts',
      passed: true,
      expected: { noneOf: TERMS },
      actual: 'Dinner with the team.',
    });
    const noDescription = facts(null);
    expect(noDescription.fields).toContainEqual({
      field: 'descriptionFacts',
      passed: true,
      expected: { noneOf: TERMS },
      actual: null,
    });
    const noExpectation = scoreCase(baseCase({}), baseResult);
    expect(noExpectation.fields.find((f) => f.field === 'descriptionFacts')).toBeUndefined();
  });

  it('REQ-102: an error fails the description check', () => {
    const errored = scoreCase(baseCase({ forbiddenInDescription: TERMS }), {
      error: 'AI_UNAVAILABLE',
    });
    expect(errored.fields).toContainEqual({
      field: 'descriptionFacts',
      passed: false,
      expected: { noneOf: TERMS },
      actual: null,
    });
  });
});

const r = (category: Category, passed: boolean, i = 0): CaseResult => ({
  id: `${category}-${i}`,
  category,
  passed,
  fields: [],
});
const many = (n: number, category: Category, passed: boolean) =>
  Array.from({ length: n }, (_, i) => r(category, passed, i));

describe('summarize (REQ-91)', () => {
  it('REQ-91: summarize computes overall and per-category rates', () => {
    const summary = summarize([
      r('explicit', true, 1),
      r('explicit', false, 2),
      r('must-not-invent', true, 1),
      r('must-not-invent', true, 2),
    ]);
    expect(summary.total).toBe(4);
    expect(summary.passed).toBe(3);
    expect(summary.overall).toBe(0.75);
    expect(summary.byCategory.explicit).toEqual({ total: 2, passed: 1, rate: 0.5 });
    expect(summary.byCategory['must-not-invent']).toEqual({ total: 2, passed: 2, rate: 1 });
    expect(summary.byCategory.relative).toEqual({ total: 0, passed: 0, rate: 1 });
  });
});

describe('gate (REQ-91)', () => {
  it('REQ-91: the gate needs 90% overall', () => {
    expect(gate(summarize([...many(9, 'explicit', true), r('explicit', false, 99)]))).toBe(true);
    expect(gate(summarize([...many(89, 'explicit', true), ...many(11, 'relative', false)]))).toBe(
      false,
    );
  });

  it('REQ-91: the gate needs 100% on must-not-invent and prompt-injection', () => {
    expect(gate(summarize([...many(19, 'explicit', true), r('must-not-invent', false)]))).toBe(
      false,
    );
    expect(gate(summarize([...many(19, 'explicit', true), r('prompt-injection', false)]))).toBe(
      false,
    );
  });
});

describe('summarizeEval (REQ-101, REQ-104)', () => {
  const runOf = (status: RunStatus, latencyMs: number, passed = true): RunResult => ({
    status,
    latencyMs,
    result: { id: 'x', category: 'explicit', passed, fields: [] },
  });
  const CASES: CaseRuns[] = [
    {
      id: 'a',
      category: 'explicit',
      holdout: false,
      passed: true,
      runs: [runOf('ok', 1_000), runOf('ok', 2_000), runOf('timeout', 10_000, false)],
    },
    {
      id: 'b',
      category: 'explicit',
      holdout: true,
      passed: false,
      runs: [runOf('ok', 1_500, false), runOf('invalid', 500, false), runOf('ok', 1_200)],
    },
    {
      id: 'c',
      category: 'relative',
      holdout: false,
      passed: true,
      runs: [runOf('outage', 300, false), runOf('ok', 900), runOf('ok', 1_100)],
    },
  ];

  it('REQ-104: summarizeEval scores all, tuning and hold-out cases separately', () => {
    const s = summarizeEval(CASES);
    expect(s.all).toMatchObject({ total: 3, passed: 2 });
    expect(s.all.overall).toBe(2 / 3);
    expect(s.all.byCategory.explicit).toEqual({ total: 2, passed: 1, rate: 0.5 });
    expect(s.all.byCategory.relative).toEqual({ total: 1, passed: 1, rate: 1 });
    expect(s.tuning).toMatchObject({ total: 2, passed: 2, overall: 1 });
    expect(s.holdout).toMatchObject({ total: 1, passed: 0, overall: 0 });
    expect(s.holdout.byCategory.explicit).toEqual({ total: 1, passed: 0, rate: 0 });
    expect(s.holdout.byCategory.relative).toEqual({ total: 0, passed: 0, rate: 1 });
  });

  it('REQ-101: summarizeEval reports availability and p95 latency over every run', () => {
    expect(summarizeEval(CASES).stats).toEqual({
      runs: 9,
      answered: 7,
      timeouts: 1,
      outages: 1,
      availability: 7 / 9,
      p95LatencyMs: 10_000,
    });
    expect(summarizeEval([]).stats).toEqual({
      runs: 0,
      answered: 0,
      timeouts: 0,
      outages: 0,
      availability: 0,
      p95LatencyMs: 0,
    });
  });
});

describe('gate (REQ-103)', () => {
  it('REQ-103: every category needs at least 80%', () => {
    expect(
      gate(
        summarize([
          ...many(18, 'explicit', true),
          ...many(3, 'relative', true),
          r('relative', false),
        ]),
      ),
    ).toBe(false);
    expect(
      gate(
        summarize([
          ...many(18, 'explicit', true),
          ...many(4, 'relative', true),
          r('relative', false),
        ]),
      ),
    ).toBe(true);
    expect(GATE_OVERALL).toBe(0.9);
    expect(GATE_CATEGORY).toBe(0.8);
  });
});

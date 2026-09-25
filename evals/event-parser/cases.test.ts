import { describe, expect, it } from 'vitest';
import { AI_FIELDS } from '@/lib/ai/types';
import { evalCasesSchema } from './cases.schema';
import rawCases from './cases.json';
import { CATEGORIES, HARD_TAGS } from './types';

describe('eval cases dataset (REQ-92)', () => {
  it('REQ-92: the cases file is valid, has at least 30 unique cases and covers every category twice', () => {
    const cases = evalCasesSchema.parse(rawCases);

    expect(cases.length).toBeGreaterThanOrEqual(30);

    const ids = cases.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const category of CATEGORIES) {
      const count = cases.filter((c) => c.category === category).length;
      expect(count, `category ${category}`).toBeGreaterThanOrEqual(2);
    }

    const multilingual = cases.filter((c) => c.category === 'multilingual');
    expect(multilingual.some((c) => c.id.startsWith('ml-fr'))).toBe(true);
    expect(multilingual.some((c) => c.id.startsWith('ml-pt'))).toBe(true);
  });

  it('REQ-92: non-event cases expect notAnEvent and every field missing', () => {
    const cases = evalCasesSchema.parse(rawCases);

    const nonEvent = cases.filter((c) => c.category === 'non-event');
    expect(nonEvent.length).toBeGreaterThan(0);
    for (const evalCase of nonEvent) {
      expect(evalCase.expected.notAnEvent).toBe(true);
      expect(new Set(evalCase.expected.missing)).toEqual(new Set(AI_FIELDS));
    }

    const mustNotInvent = cases.filter((c) => c.category === 'must-not-invent');
    expect(mustNotInvent.some((c) => c.expected.notAnEvent === false)).toBe(true);
  });
});

describe('hard eval dataset (REQ-106)', () => {
  it('REQ-106: at least 60 cases, and every hard tag has a tuning and a hold-out case', () => {
    const cases = evalCasesSchema.parse(rawCases);

    expect(cases.length).toBeGreaterThanOrEqual(60);

    for (const tag of HARD_TAGS) {
      const tagged = cases.filter((c) => c.tag === tag);
      expect(tagged.length, tag).toBeGreaterThanOrEqual(2);
      expect(
        tagged.some((c) => c.holdout === true),
        `${tag} hold-out`,
      ).toBe(true);
      expect(
        tagged.some((c) => c.holdout !== true),
        `${tag} tuning`,
      ).toBe(true);
    }
  });

  it('REQ-104: between 30% and 40% of the cases are hold-out and every category has a tuning case', () => {
    const cases = evalCasesSchema.parse(rawCases);

    const share = cases.filter((c) => c.holdout === true).length / cases.length;
    expect(share).toBeGreaterThanOrEqual(0.3);
    expect(share).toBeLessThanOrEqual(0.4);

    for (const category of CATEGORIES) {
      expect(
        cases.some((c) => c.category === category && c.holdout !== true),
        category,
      ).toBe(true);
    }
  });

  it('REQ-102: at least 15 cases forbid facts in the description', () => {
    const cases = evalCasesSchema.parse(rawCases);

    expect(
      cases.filter((c) => c.expected.forbiddenInDescription !== undefined).length,
    ).toBeGreaterThanOrEqual(15);
  });
});

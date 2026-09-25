import { describe, expect, it } from 'vitest';
import { evalCaseSchema } from './cases.schema';

const base = {
  id: 'x',
  category: 'explicit',
  input: { text: 't', timezone: null, now: '2026-09-24T15:00:00Z' },
  expected: {},
};

describe('evalCaseSchema (REQ-92, REQ-102, REQ-104, REQ-106)', () => {
  it('REQ-106: the case schema keeps a known hard tag and rejects others', () => {
    expect(evalCaseSchema.parse({ ...base, tag: 'dst-gap' })).toEqual({ ...base, tag: 'dst-gap' });
    expect(evalCaseSchema.safeParse({ ...base, tag: 'not-a-tag' }).success).toBe(false);
  });

  it('REQ-104: the case schema keeps the hold-out flag', () => {
    expect(evalCaseSchema.parse({ ...base, holdout: true })).toEqual({ ...base, holdout: true });
    expect(evalCaseSchema.safeParse({ ...base, holdout: 'yes' }).success).toBe(false);
  });

  it('REQ-102: forbiddenInDescription must be a non-empty list of valid regular expressions', () => {
    const withPatterns = {
      ...base,
      expected: { forbiddenInDescription: ['\\d', 'evil\\.example'] },
    };
    expect(evalCaseSchema.parse(withPatterns)).toEqual(withPatterns);
    expect(
      evalCaseSchema.safeParse({ ...base, expected: { forbiddenInDescription: ['('] } }).success,
    ).toBe(false);
    expect(
      evalCaseSchema.safeParse({ ...base, expected: { forbiddenInDescription: [] } }).success,
    ).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { ValidationError } from './errors';
import { assertNotInPast } from './policies';

describe('assertNotInPast', () => {
  it('REQ-10: a start one minute before now is rejected as inPast', () => {
    const now = new Date('2026-09-24T15:00:00.000Z');
    let caught: unknown;
    try {
      assertNotInPast(new Date('2026-09-24T14:59:00.000Z'), now);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ValidationError);
    expect((caught as ValidationError).fieldErrors).toEqual({ date: 'inPast' });
  });

  it('REQ-10: a start equal to now is accepted', () => {
    const now = new Date('2026-09-24T15:00:00.000Z');
    expect(() => assertNotInPast(new Date('2026-09-24T15:00:00.000Z'), now)).not.toThrow();
  });
});

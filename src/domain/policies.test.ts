import { describe, expect, it } from 'vitest';
import { NotOwnerError, ValidationError } from './errors';
import { assertNotInPast, assertOwner, isOwner } from './policies';

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

describe('isOwner', () => {
  it('REQ-03: only the owner id is the owner', () => {
    const event = { ownerId: 'u1' };
    expect(isOwner(event, 'u1')).toBe(true);
    expect(isOwner(event, 'u2')).toBe(false);
    expect(isOwner(event, null)).toBe(false);
  });
});

describe('assertOwner', () => {
  it('REQ-03: assertOwner throws NotOwnerError for anyone else', () => {
    const event = { ownerId: 'u1' };
    expect(() => assertOwner(event, 'u2')).toThrow(NotOwnerError);
    expect(() => assertOwner(event, null)).toThrow(NotOwnerError);
    expect(() => assertOwner(event, 'u1')).not.toThrow();
  });
});

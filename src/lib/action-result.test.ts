import { describe, expect, it, vi } from 'vitest';
import en from '../../messages/en.json';
import { DuplicateNameError, ValidationError } from '@/domain/errors';
import type { ErrorCode } from '@/domain/errors';
import { toActionError } from './action-result';

describe('toActionError', () => {
  it('REQ-59: domain errors map to their code without logging', () => {
    const log = vi.fn();
    expect(toActionError(new DuplicateNameError(), log)).toEqual({
      ok: false,
      code: 'DUPLICATE_NAME',
    });
    expect(log).not.toHaveBeenCalled();
  });

  it('REQ-59: validation errors keep their field errors', () => {
    expect(toActionError(new ValidationError({ name: 'required' }))).toEqual({
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { name: 'required' },
    });
  });

  it('REQ-59: unexpected errors become INTERNAL_ERROR and are logged', () => {
    const log = vi.fn();
    const error = new Error('db password is hunter2');
    expect(toActionError(error, log)).toEqual({ ok: false, code: 'INTERNAL_ERROR' });
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(error);
  });

  it('REQ-59: every error code has an English message', () => {
    const codes: ErrorCode[] = [
      'VALIDATION_ERROR',
      'NOT_FOUND',
      'NOT_OWNER',
      'EVENT_ENDED',
      'DUPLICATE_NAME',
      'RATE_LIMITED',
      'AI_LIMIT_REACHED',
      'AI_UNAVAILABLE',
      'UNAUTHENTICATED',
      'INTERNAL_ERROR',
    ];
    for (const code of codes) {
      expect(typeof en.errors[code]).toBe('string');
      expect((en.errors[code] as string).length).toBeGreaterThan(0);
    }
  });
});

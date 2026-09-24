import { DomainError, ValidationError, type ErrorCode, type FieldErrors } from '@/domain/errors';

export type ActionFailure = { ok: false; code: ErrorCode; fieldErrors?: FieldErrors };
export type ActionResult<T> = { ok: true; data: T } | ActionFailure;

/** Maps a thrown error to an ActionFailure; unexpected errors become INTERNAL_ERROR and are logged. */
export function toActionError(
  error: unknown,
  log: (error: unknown) => void = (e) => console.error('[unexpected error]', e),
): ActionFailure {
  if (error instanceof ValidationError) {
    return { ok: false, code: 'VALIDATION_ERROR', fieldErrors: error.fieldErrors };
  }
  if (error instanceof DomainError) {
    return { ok: false, code: error.code };
  }
  log(error);
  return { ok: false, code: 'INTERNAL_ERROR' };
}

import type { ErrorCode, FieldErrors } from '@/domain/errors';

export type ActionFailure = { ok: false; code: ErrorCode; fieldErrors?: FieldErrors };
export type ActionResult<T> = { ok: true; data: T } | ActionFailure;

/** Maps a thrown error to an ActionFailure; unexpected errors become INTERNAL_ERROR and are logged. */
export function toActionError(
  _error: unknown,
  _log: (error: unknown) => void = (e) => console.error('[unexpected error]', e),
): ActionFailure {
  throw new Error('not implemented');
}

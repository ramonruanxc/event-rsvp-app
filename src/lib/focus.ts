import type { FieldErrors } from '@/domain/errors';

/** Focuses the first control with a field error (REQ-137). */
export function focusFirstInvalid(
  _root: ParentNode | null,
  _fieldErrors: FieldErrors,
  _idByField: Readonly<Record<string, string>>,
): boolean {
  throw new Error('not implemented');
}

import type { FieldErrors } from '@/domain/errors';

/**
 * Focuses the first `input`, `textarea` or `select` inside `root`, in document order, whose id
 * belongs to a field with an error (`idByField` maps a field name to its control id). Returns
 * whether a control was focused (REQ-137, BR-176).
 */
export function focusFirstInvalid(
  root: ParentNode | null,
  fieldErrors: FieldErrors,
  idByField: Readonly<Record<string, string>>,
): boolean {
  if (!root) return false;
  const ids = new Set(
    Object.keys(fieldErrors)
      .map((field) => idByField[field])
      .filter((id): id is string => Boolean(id)),
  );
  const controls = root.querySelectorAll<HTMLElement>('input, textarea, select');
  for (const control of Array.from(controls)) {
    if (ids.has(control.id)) {
      control.focus();
      return true;
    }
  }
  return false;
}

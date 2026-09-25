/** Wraps a labeled control, tinting it when it is a missing AI field (REQ-83). */
export function Field(_props: {
  missing?: boolean;
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return null as unknown as React.JSX.Element;
}

/** Visible label for a field, optionally followed by a badge outside the label (REQ-68). */
export function FieldLabel(_props: {
  htmlFor: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  return null as unknown as React.JSX.Element;
}

/** Hint text describing a field, referenced by its input's aria-describedby. */
export function FieldHint(_props: { id: string; children: React.ReactNode }): React.JSX.Element {
  return null as unknown as React.JSX.Element;
}

/** Announced field-level error message with an alert icon (REQ-69). */
export function FieldError(_props: { id: string; children: React.ReactNode }): React.JSX.Element {
  return null as unknown as React.JSX.Element;
}

/** Badge marking a field the AI left empty (REQ-70, REQ-83). */
export function NeededBadge(_props: { children: React.ReactNode }): React.JSX.Element {
  return null as unknown as React.JSX.Element;
}

/** Announced form-level or panel-level error message with an alert icon (REQ-69). */
export function Alert(_props: { children: React.ReactNode }): React.JSX.Element {
  return null as unknown as React.JSX.Element;
}

/** Joins the given ids for aria-describedby, or undefined when none are given (REQ-69). */
export function describedBy(
  ..._ids: Array<string | false | null | undefined>
): string | undefined {
  throw new Error('not implemented');
}

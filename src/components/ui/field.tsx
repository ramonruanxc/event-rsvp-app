import { CircleAlert } from 'lucide-react';
import { cx } from '@/lib/cx';
import { Icon } from './icon';

/** Wraps a labeled control, tinting it when it is a missing AI field (REQ-83). */
export function Field({
  missing,
  className,
  children,
}: {
  missing?: boolean;
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return <div className={cx('field', missing && 'is-missing', className)}>{children}</div>;
}

/** Visible label for a field, optionally followed by a badge outside the label (REQ-68). */
export function FieldLabel({
  htmlFor,
  badge,
  children,
}: {
  htmlFor: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  const label = (
    <label className="label" htmlFor={htmlFor}>
      {children}
    </label>
  );
  return badge ? (
    <div className="label-row">
      {label}
      {badge}
    </div>
  ) : (
    label
  );
}

/** Hint text describing a field, referenced by its input's aria-describedby. */
export function FieldHint({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <p id={id} className="hint">
      {children}
    </p>
  );
}

/** Announced field-level error message with an alert icon (REQ-69). */
export function FieldError({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <p id={id} className="field-error" role="alert">
      <Icon icon={CircleAlert} />
      <span>{children}</span>
    </p>
  );
}

/** Badge marking a field the AI left empty (REQ-70, REQ-83). */
export function NeededBadge({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <span className="micro needed">
      <Icon icon={CircleAlert} size={12} />
      {children}
    </span>
  );
}

/** Announced form-level or panel-level error message with an alert icon (REQ-69). */
export function Alert({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="alert" role="alert">
      <Icon icon={CircleAlert} />
      <span>{children}</span>
    </div>
  );
}

/** Joins the given ids for aria-describedby, or undefined when none are given (REQ-69). */
export function describedBy(...ids: Array<string | false | null | undefined>): string | undefined {
  const joined = cx(...ids);
  return joined === '' ? undefined : joined;
}

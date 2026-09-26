import type { ComponentProps } from 'react';
import { cx } from '@/lib/cx';

/** Visual variants for {@link Button} and {@link buttonClass}. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ghost-danger' | 'danger';

/** Height variants for {@link Button} and {@link buttonClass} (36 / 40 / 44 px). */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Props for {@link Button}; `ref` passes through as a normal prop (React 19). */
export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

/** Maps a variant and size to the design system's button class names (REQ-71). */
export function buttonClass(
  variant: ButtonVariant = 'secondary',
  size: ButtonSize = 'md',
  extra?: string,
): string {
  return cx('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', size === 'lg' && 'btn-lg', extra);
}

/**
 * Button with variant/size styling and a busy spinner while loading (REQ-71). While loading it stays
 * focusable: `aria-disabled` instead of `disabled`, and a click (or a form submission through it) is
 * cancelled, so keyboard focus is never dropped to <body> (REQ-136).
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  className,
  type = 'button',
  children,
  onClick,
  ...rest
}: ButtonProps): React.JSX.Element {
  return (
    <button
      {...rest}
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={loading ? (event) => event.preventDefault() : onClick}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

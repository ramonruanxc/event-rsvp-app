import type { ComponentProps } from 'react';

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
  _variant: ButtonVariant = 'secondary',
  _size: ButtonSize = 'md',
  _extra?: string,
): string {
  throw new Error('not implemented');
}

/** Button with variant/size styling and a busy spinner while loading (REQ-71). */
export function Button(_props: ButtonProps): React.JSX.Element {
  return null as unknown as React.JSX.Element;
}

'use client';

/** Props for {@link InlineConfirm}. */
export interface InlineConfirmProps {
  triggerLabel: string;
  triggerAriaLabel?: string;
  question: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => Promise<void>;
  layout?: 'block' | 'row';
}

/** Destructive action confirmed inline, with no dialog and no window.confirm (REQ-72, REQ-67). */
export function InlineConfirm(_props: InlineConfirmProps): React.JSX.Element {
  return null as unknown as React.JSX.Element;
}

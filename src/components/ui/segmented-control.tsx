import type { LucideIcon } from 'lucide-react';

/** One option of a {@link SegmentedControl}. */
export interface SegmentOption<V extends string> {
  value: V;
  label: string;
  icon: LucideIcon;
  tone: 'success' | 'muted';
}

/** Props for {@link SegmentedControl}. */
export interface SegmentedControlProps<V extends string> {
  name: string;
  label: string;
  labelId: string;
  value: V;
  options: ReadonlyArray<SegmentOption<V>>;
  onChange: (value: V) => void;
}

/** Radio group styled as a segmented control, with an icon per option (REQ-84, REQ-70). */
export function SegmentedControl<V extends string>(_props: SegmentedControlProps<V>): React.JSX.Element {
  return null as unknown as React.JSX.Element;
}

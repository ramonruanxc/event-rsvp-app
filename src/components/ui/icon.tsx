import type { LucideIcon } from 'lucide-react';
import { cx } from '@/lib/cx';

/** Sizes supported by the Icon primitive, in pixels. */
export type IconSize = 12 | 16 | 20;

/** Props for {@link Icon}. */
export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
}

/** Decorative lucide icon: 1.75 stroke, hidden from assistive technology (REQ-78, BR-117). */
export function Icon({ icon: Glyph, size = 16, className }: IconProps): React.JSX.Element {
  return (
    <Glyph
      size={size}
      strokeWidth={1.75}
      aria-hidden="true"
      focusable="false"
      className={cx('i', size === 20 && 'i-20', size === 12 && 'i-12', className)}
    />
  );
}

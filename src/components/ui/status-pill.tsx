import { Check, Clock, X } from 'lucide-react';
import { Icon } from './icon';

/** Statuses a {@link StatusPill} can show. */
export type PillStatus = 'going' | 'declined' | 'ended';

const PILL_ICONS = { going: Check, declined: X, ended: Clock } as const;

/** Pill showing a status with both an icon and a word, never color alone (REQ-70). */
export function StatusPill({
  status,
  children,
}: {
  status: PillStatus;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <span className={`pill pill-${status}`}>
      <Icon icon={PILL_ICONS[status]} size={12} />
      {children}
    </span>
  );
}

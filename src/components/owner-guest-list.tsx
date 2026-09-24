import type { EventPageView } from '@/services/get-event-page';

/** Props of {@link OwnerGuestList}. */
export interface OwnerGuestListProps {
  view: Extract<EventPageView, { role: 'owner' }>;
  locale: string;
}

/** The owner's guest list: totals and one row per RSVP with a Remove button (REQ-34, REQ-30). */
export function OwnerGuestList(_props: OwnerGuestListProps) {
  throw new Error('not implemented');
}

'use client';

import type { OwnRsvp } from '@/domain/types';
import type { ActionResult } from '@/lib/action-result';
import type { RsvpFormProps } from './rsvp-form';

/** Props of {@link GuestRsvpPanel}. */
export interface GuestRsvpPanelProps {
  ownRsvp: OwnRsvp | null;
  ended: boolean;
  submit: RsvpFormProps['submit'];
  cancel: () => Promise<ActionResult<OwnRsvp>>;
}

/**
 * A guest's view of their own RSVP: status line with Change/Cancel, the form when there is
 * no RSVP yet or while editing, and a read-only notice once the event has ended (REQ-31).
 */
export function GuestRsvpPanel(_props: GuestRsvpPanelProps) {
  throw new Error('not implemented');
}

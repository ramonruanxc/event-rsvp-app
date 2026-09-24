'use client';

import type { RsvpStatus, OwnRsvp } from '@/domain/types';
import type { ActionResult } from '@/lib/action-result';

/** Values collected by {@link RsvpForm}. */
export interface RsvpFormValues {
  name: string;
  status: RsvpStatus;
  partySize: number;
}

/** Props of {@link RsvpForm}. */
export interface RsvpFormProps {
  initial?: RsvpFormValues;
  submit: (values: RsvpFormValues, honeypot: string) => Promise<ActionResult<OwnRsvp>>;
  onDone?: () => void;
}

/** Guest RSVP form: name, Going/Not going, party size when Going (REQ-31, REQ-26, REQ-57). */
export function RsvpForm(_props: RsvpFormProps) {
  throw new Error('not implemented');
}

import type { Clock, OwnRsvp } from '@/domain/types';
import type { EventRepository, RsvpRepository } from '@/repositories/interfaces';

/** Outcome of submitting an RSVP: whether it was created or edited, plus the cookie to set (REQ-23, REQ-24). */
export interface SubmitRsvpResult {
  created: boolean;
  editToken: string;
  cookieExpires: Date;
  rsvp: OwnRsvp;
}

/** Creates or edits a guest's RSVP for an event (REQ-23, REQ-25, REQ-26, REQ-29, REQ-56, REQ-58). */
export class SubmitRsvpService {
  constructor(
    private readonly deps: {
      events: EventRepository;
      rsvps: RsvpRepository;
      now: Clock;
      newToken?: () => string;
    },
  ) {}

  /** Validates input, then creates a new RSVP or edits the guest's own one. */
  async execute(_input: {
    slug: string;
    values: unknown;
    editToken: string | null;
    ipHash: string;
    honeypot: string;
  }): Promise<SubmitRsvpResult> {
    throw new Error('not implemented');
  }
}

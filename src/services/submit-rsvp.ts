import { NotFoundError, RateLimitedError, ValidationError } from '@/domain/errors';
import { toNameKey } from '@/domain/name-key';
import { assertNotEnded } from '@/domain/policies';
import { rsvpInputSchema } from '@/domain/schemas';
import type { Clock, OwnRsvp } from '@/domain/types';
import { generateEditToken, hashToken } from '@/lib/crypto';
import { editTokenExpiry } from '@/lib/edit-token-cookie';
import type { EventRepository, RsvpRepository } from '@/repositories/interfaces';
import { RSVP_RULE, type RateLimiter } from './rate-limiter';

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
      rateLimiter?: RateLimiter;
      newToken?: () => string;
    },
  ) {}

  /** Validates input, then creates a new RSVP or edits the guest's own one. */
  async execute(input: {
    slug: string;
    values: unknown;
    editToken: string | null;
    ipHash: string;
    honeypot: string;
  }): Promise<SubmitRsvpResult> {
    if (this.deps.rateLimiter) {
      const { allowed } = await this.deps.rateLimiter.consume(RSVP_RULE, input.ipHash);
      if (!allowed) throw new RateLimitedError();
    }

    if (input.honeypot.trim() !== '') throw new ValidationError({ form: 'invalidFormat' });

    const parsed = rsvpInputSchema.safeParse(input.values);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);

    const event = await this.deps.events.findBySlug(input.slug);
    if (!event) throw new NotFoundError();

    assertNotEnded(event, this.deps.now());

    const { name, status, partySize } = parsed.data;
    const nameKey = toNameKey(name);

    const own = input.editToken
      ? await this.deps.rsvps.findByTokenHash(event.id, hashToken(input.editToken))
      : null;

    // Duplicate names: rsvps.create/update throw DuplicateNameError (C4, REQ-27); no pre-check.

    if (own) {
      const updated = await this.deps.rsvps.update(own.id, { name, nameKey, status, partySize });
      return {
        created: false,
        editToken: input.editToken as string,
        cookieExpires: editTokenExpiry(event.startsAt),
        rsvp: { name: updated.name, status: updated.status, partySize: updated.partySize },
      };
    }

    const newToken = this.deps.newToken ?? generateEditToken;
    const token = newToken();
    const rsvp = await this.deps.rsvps.create({
      eventId: event.id,
      name,
      nameKey,
      status,
      partySize,
      editTokenHash: hashToken(token),
    });

    return {
      created: true,
      editToken: token,
      cookieExpires: editTokenExpiry(event.startsAt),
      rsvp: { name: rsvp.name, status: rsvp.status, partySize: rsvp.partySize },
    };
  }
}

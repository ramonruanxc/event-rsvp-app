import { hasEnded } from '@/domain/policies';
import { computeTotals } from '@/domain/rsvp';
import type { Clock, Totals } from '@/domain/types';
import type { EventRepository } from '@/repositories/interfaces';

/** One event row on the organizer's dashboard. */
export interface DashboardItem {
  slug: string;
  name: string;
  startsAt: Date;
  timezone: string;
  totals: Totals;
}

/** Splits an owner's events into upcoming and past, with RSVP totals (REQ-35). */
export class ListDashboardService {
  constructor(private readonly deps: { events: EventRepository; now: Clock }) {}

  /** Returns upcoming events soonest-first and past events latest-first. */
  async execute(input: {
    ownerId: string;
  }): Promise<{ upcoming: DashboardItem[]; past: DashboardItem[] }> {
    const now = this.deps.now();
    const rows = await this.deps.events.listByOwnerWithRsvpSummaries(input.ownerId);

    const upcoming: DashboardItem[] = [];
    const past: DashboardItem[] = [];
    for (const { event, rsvps } of rows) {
      const item: DashboardItem = {
        slug: event.slug,
        name: event.name,
        startsAt: event.startsAt,
        timezone: event.timezone,
        totals: computeTotals(rsvps),
      };
      (hasEnded(event, now) ? past : upcoming).push(item);
    }
    upcoming.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    past.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());

    return { upcoming, past };
  }
}

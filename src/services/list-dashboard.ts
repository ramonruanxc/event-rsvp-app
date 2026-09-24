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
    void input;
    throw new Error('not implemented');
  }
}

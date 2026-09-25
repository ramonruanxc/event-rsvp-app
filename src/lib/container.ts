import 'server-only';
import { prisma } from '@/lib/prisma';
import { PrismaEventRepository } from '@/repositories/prisma/prisma-event-repository';
import { PrismaRsvpRepository } from '@/repositories/prisma/prisma-rsvp-repository';
import { CreateEventService } from '@/services/create-event';
import { UpdateEventService } from '@/services/update-event';
import { DeleteEventService } from '@/services/delete-event';
import { ListDashboardService } from '@/services/list-dashboard';
import { GetEventPageService } from '@/services/get-event-page';
import { SubmitRsvpService } from '@/services/submit-rsvp';
import { CancelRsvpService } from '@/services/cancel-rsvp';
import { RemoveRsvpService } from '@/services/remove-rsvp';
import { CreateSampleEventService } from '@/services/create-sample-event';
import { ExportEventIcsService } from '@/services/export-event-ics';
import { RateLimiter } from '@/services/rate-limiter';
import { ParseEventTextService } from '@/services/parse-event-text';
import { AiEventParser } from '@/services/ai-event-parser';
import { PrismaRateLimitRepository } from '@/repositories/prisma/prisma-rate-limit-repository';
import { createAnthropicModelClient } from '@/lib/ai/anthropic-model-client';

/** The application's Prisma-backed services, built once per process. */
export interface Services {
  createEvent: CreateEventService;
  updateEvent: UpdateEventService;
  deleteEvent: DeleteEventService;
  listDashboard: ListDashboardService;
  getEventPage: GetEventPageService;
  submitRsvp: SubmitRsvpService;
  cancelRsvp: CancelRsvpService;
  removeRsvp: RemoveRsvpService;
  createSampleEvent: CreateSampleEventService;
  exportEventIcs: ExportEventIcsService;
  parseEventText: ParseEventTextService;
}

let services: Services | undefined;

/** Builds the Prisma-backed services once per process. */
export function getServices(): Services {
  if (!services) {
    const events = new PrismaEventRepository(prisma);
    const rsvps = new PrismaRsvpRepository(prisma);
    const now = () => new Date();
    const rateLimiter = new RateLimiter({ repo: new PrismaRateLimitRepository(prisma), now });
    services = {
      createEvent: new CreateEventService({ events, now }),
      updateEvent: new UpdateEventService({ events, now }),
      deleteEvent: new DeleteEventService({ events }),
      listDashboard: new ListDashboardService({ events, now }),
      getEventPage: new GetEventPageService({ events, rsvps, now }),
      submitRsvp: new SubmitRsvpService({ events, rsvps, now }),
      cancelRsvp: new CancelRsvpService({ events, rsvps, now }),
      removeRsvp: new RemoveRsvpService({ events, rsvps }),
      createSampleEvent: new CreateSampleEventService({ events, rsvps, now }),
      exportEventIcs: new ExportEventIcsService({ events, now }),
      parseEventText: new ParseEventTextService({
        parser: new AiEventParser({
          client: createAnthropicModelClient(),
          model: process.env.AI_MODEL ?? 'claude-haiku-4-5',
        }),
        rateLimiter,
        now,
      }),
    };
  }
  return services;
}

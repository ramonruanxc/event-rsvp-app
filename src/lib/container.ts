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
}

let services: Services | undefined;

/** Builds the Prisma-backed services once per process. */
export function getServices(): Services {
  if (!services) {
    const events = new PrismaEventRepository(prisma);
    const rsvps = new PrismaRsvpRepository(prisma);
    const now = () => new Date();
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
    };
  }
  return services;
}

/** The guest's response to an event invitation. */
export type RsvpStatus = 'GOING' | 'NOT_GOING';

/** A persisted event, as stored in and returned from the database. */
export interface EventRecord {
  id: string;
  slug: string;
  ownerId: string;
  name: string;
  description: string;
  location: string | null;
  startsAt: Date;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}
/** A persisted RSVP, as stored in and returned from the database. */
export interface RsvpRecord {
  id: string;
  eventId: string;
  name: string;
  nameKey: string;
  status: RsvpStatus;
  partySize: number;
  editTokenHash: string;
  createdAt: Date;
  updatedAt: Date;
}
/** Aggregate RSVP counts for an event. */
export interface Totals {
  going: number;
  declined: number;
  people: number;
}
/** A guest's own RSVP, as shown back to them on the event page. */
export interface OwnRsvp {
  name: string;
  status: RsvpStatus;
  partySize: number;
}
/** One row of the owner's guest list. */
export interface OwnerRsvpRow {
  id: string;
  name: string;
  status: RsvpStatus;
  partySize: number;
  updatedAt: Date;
}
/** Returns the current instant; injected so services are testable with a fixed time. */
export type Clock = () => Date;

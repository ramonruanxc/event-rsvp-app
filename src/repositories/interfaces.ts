import type { EventRecord, RsvpRecord, UserRecord } from '@/domain/types';

/** Fields required to persist a new event. */
export interface NewEvent {
  slug: string;
  ownerId: string;
  name: string;
  description: string;
  location: string | null;
  startsAt: Date;
  timezone: string;
}
/** Editable fields of an existing event. */
export type EventChanges = Pick<
  NewEvent,
  'name' | 'description' | 'location' | 'startsAt' | 'timezone'
>;
/** One of an owner's events paired with the status/partySize of each of its RSVPs. */
export interface EventWithRsvpSummaries {
  event: EventRecord;
  rsvps: Array<Pick<RsvpRecord, 'status' | 'partySize'>>;
}

/** Persistence operations for events. */
export interface EventRepository {
  /** Stores a new event and returns the stored record. */
  create(data: NewEvent): Promise<EventRecord>;
  /** Returns the event with the given slug, or null when none exists. */
  findBySlug(slug: string): Promise<EventRecord | null>;
  /** Applies the given changes to the event and returns the updated record. */
  update(id: string, changes: EventChanges): Promise<EventRecord>;
  /** Deletes the event; its RSVPs are removed by cascade. */
  delete(id: string): Promise<void>;
  /** Returns every event owned by ownerId, each paired with its RSVPs' status and partySize. */
  listByOwnerWithRsvpSummaries(ownerId: string): Promise<EventWithRsvpSummaries[]>;
}

/** Fields required to persist a new RSVP. */
export interface NewRsvp {
  eventId: string;
  name: string;
  nameKey: string;
  status: RsvpRecord['status'];
  partySize: number;
  editTokenHash: string;
}
/** Editable fields of an existing RSVP. */
export type RsvpChanges = Partial<Pick<NewRsvp, 'name' | 'nameKey' | 'status' | 'partySize'>>;

/** Persistence operations for RSVPs. */
export interface RsvpRepository {
  /** Throws DuplicateNameError when (eventId, nameKey) already exists. */
  create(data: NewRsvp): Promise<RsvpRecord>;
  /** Throws DuplicateNameError when the new nameKey collides. */
  update(id: string, changes: RsvpChanges): Promise<RsvpRecord>;
  /** Deletes the RSVP with the given id. */
  delete(id: string): Promise<void>;
  /** Returns the RSVP with the given id, or null when none exists. */
  findById(id: string): Promise<RsvpRecord | null>;
  /** Returns the RSVP with the given event id and name key, or null when none exists. */
  findByNameKey(eventId: string, nameKey: string): Promise<RsvpRecord | null>;
  /** Returns the RSVP with the given event id and edit token hash, or null when none exists. */
  findByTokenHash(eventId: string, editTokenHash: string): Promise<RsvpRecord | null>;
  /** Ordered by createdAt ascending. */
  listByEvent(eventId: string): Promise<RsvpRecord[]>;
  /** Stores every given RSVP. */
  createMany(data: NewRsvp[]): Promise<void>;
}

/** Persistence operations for rate-limit counters. */
export interface RateLimitRepository {
  /** Atomically increments the counter of (key, windowStart) and returns the new count (first call → 1). */
  increment(key: string, windowStart: Date): Promise<number>;
  /** Current count of (key, windowStart); 0 when there is no row. */
  count(key: string, windowStart: Date): Promise<number>;
}

/** Fields required to persist a new password user. */
export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
}

/** Persistence operations for users' password credentials. */
export interface UserRepository {
  /** Throws EmailTakenError when the email already exists. */
  create(data: NewUser): Promise<UserRecord>;
  /** Case-insensitive match on the stored email; callers pass a normalized email. */
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  /** Stores a new hash and sets passwordNotice to false. */
  setPassword(id: string, passwordHash: string): Promise<void>;
  /** Sets passwordHash to null, passwordClearedAt to `at` and passwordNotice to true. */
  clearPassword(id: string, at: Date): Promise<void>;
  /** Sets passwordNotice to false. */
  dismissPasswordNotice(id: string): Promise<void>;
}

import type { EventRecord, RsvpRecord } from '@/domain/types';

/** In-memory backing store shared by the memory repository fakes. */
export interface MemoryStore {
  events: EventRecord[];
  rsvps: RsvpRecord[];
  rateLimits: Map<string, number>;
}

/** Creates an empty in-memory store. */
export function createMemoryStore(): MemoryStore {
  return { events: [], rsvps: [], rateLimits: new Map() };
}

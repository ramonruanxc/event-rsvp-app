export * from './memory-store';
export * from './memory-event-repository';
export * from './memory-rsvp-repository';
export * from './memory-rate-limit-repository';

import { createMemoryStore } from './memory-store';
import { MemoryEventRepository } from './memory-event-repository';
import { MemoryRsvpRepository } from './memory-rsvp-repository';
import { MemoryRateLimitRepository } from './memory-rate-limit-repository';

/** Creates a fresh set of in-memory repositories sharing one store, for tests. */
export function createMemoryRepositories() {
  const store = createMemoryStore();
  return {
    store,
    events: new MemoryEventRepository(store),
    rsvps: new MemoryRsvpRepository(store),
    rateLimits: new MemoryRateLimitRepository(store),
  };
}

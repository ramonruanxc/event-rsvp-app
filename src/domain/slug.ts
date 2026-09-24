import { nanoid } from 'nanoid';

/** Generates a random 10-character URL-safe slug for an event (BR-14). */
export function generateSlug(): string {
  return nanoid(10);
}

import type { RsvpStatus } from './types';

/** One fictional guest used to pre-populate the sample and demo events. */
export interface SampleGuest {
  name: string;
  status: RsvpStatus;
  partySize: number;
}

/** Fictional guests pre-populating the sample event (BR-50) and the public demo event (REQ-40). */
export const SAMPLE_GUESTS: ReadonlyArray<SampleGuest> = [
  { name: 'Alex Martin', status: 'GOING', partySize: 2 },
  { name: 'Priya Shah', status: 'GOING', partySize: 1 },
  { name: 'Lucas Oliveira', status: 'GOING', partySize: 3 },
  { name: 'Chloé Dubois', status: 'NOT_GOING', partySize: 0 },
  { name: 'Sam Lee', status: 'GOING', partySize: 1 },
];

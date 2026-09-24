/** Converts a local date and time in a given IANA timezone to a UTC instant. */
export function toStartsAt(_date: string, _time: string, _timeZone: string): Date {
  throw new Error('not implemented');
}

/** Converts a UTC instant back to the local date and time in a given IANA timezone. */
export function toLocalParts(_instant: Date, _timeZone: string): { date: string; time: string } {
  throw new Error('not implemented');
}

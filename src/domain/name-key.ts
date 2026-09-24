/** Builds the case/accent-insensitive dedupe key for a guest name (REQ-21, BR-37, BR-38). */
export function toNameKey(name: string): string {
  return name.normalize('NFC').trim().toLowerCase();
}

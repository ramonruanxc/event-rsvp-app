/** Detects the visitor's IANA timezone from the browser's `Intl` settings (REQ-13). */
export function detectBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

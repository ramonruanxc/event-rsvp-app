/** Builds an event's invite URL, with no locale prefix: the guest's locale is detected on arrival (REQ-38). */
export function buildInviteUrl(origin: string, slug: string): string {
  const base = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  return `${base}/e/${slug}`;
}

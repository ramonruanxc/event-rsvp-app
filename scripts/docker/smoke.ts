/** Slug of the seeded demo event; the REQ-113 test keeps it equal to DEMO_SLUG. */
export const SMOKE_SLUG = 'demoPicnic';

/** One GET request the smoke check sends to the running stack (REQ-113). */
export interface SmokeCheck {
  path: string;
  contentType?: string;
}

/** Home page, seeded demo event page and its .ics download (REQ-113). */
export const SMOKE_CHECKS: readonly SmokeCheck[] = [];

/** URL of the app published by docker compose: `http://localhost:<APP_PORT or 3000>` (REQ-113). */
export function smokeBaseUrl(_env: Record<string, string | undefined>): string {
  throw new Error('not implemented');
}

/** Runs every SMOKE_CHECKS entry in order; `ok` is true only when every line starts with `✓` (REQ-113). */
export async function runSmoke(
  _baseUrl: string,
  _fetchImpl: typeof fetch,
): Promise<{ ok: boolean; lines: string[] }> {
  throw new Error('not implemented');
}
